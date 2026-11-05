package realtime

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Origin checked via CORS middleware or allowed for websockets
	},
}

type Client struct {
	Hub      *Hub
	Conn     *websocket.Conn
	Send     chan []byte
	VideoID  string
	MemberID string
	FullName string
	IsAdmin  bool
}

type MessagePayload struct {
	Type       string                 `json:"type"` // "chat", "live_status", "notification", "viewer_count"
	VideoID    string                 `json:"video_id,omitempty"`
	SenderName string                 `json:"sender_name,omitempty"`
	Message    string                 `json:"message,omitempty"`
	IsAdmin    bool                   `json:"is_admin,omitempty"`
	Count      int                    `json:"count,omitempty"`
	Data       map[string]interface{} `json:"data,omitempty"`
	Timestamp  string                 `json:"timestamp,omitempty"`
}

type Hub struct {
	clients    map[*Client]bool
	rooms      map[string]map[*Client]bool
	broadcast  chan MessagePayload
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
		broadcast:  make(chan MessagePayload),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			if client.VideoID != "" {
				if _, ok := h.rooms[client.VideoID]; !ok {
					h.rooms[client.VideoID] = make(map[*Client]bool)
				}
				h.rooms[client.VideoID][client] = true
			}
			h.mu.Unlock()
			h.broadcastViewerCount(client.VideoID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
			}
			if client.VideoID != "" {
				if room, ok := h.rooms[client.VideoID]; ok {
					delete(room, client)
					if len(room) == 0 {
						delete(h.rooms, client.VideoID)
					}
				}
			}
			h.mu.Unlock()
			h.broadcastViewerCount(client.VideoID)

		case msg := <-h.broadcast:
			raw, err := json.Marshal(msg)
			if err != nil {
				continue
			}

			h.mu.RLock()
			if msg.VideoID != "" {
				// Send to specific video room viewers
				if room, ok := h.rooms[msg.VideoID]; ok {
					for client := range room {
						select {
						case client.Send <- raw:
						default:
							close(client.Send)
							delete(h.clients, client)
							delete(room, client)
						}
					}
				}
			} else {
				// Global broadcast (e.g. notifications, platform alerts)
				for client := range h.clients {
					select {
					case client.Send <- raw:
					default:
						close(client.Send)
						delete(h.clients, client)
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastMessage(msg MessagePayload) {
	if msg.Timestamp == "" {
		msg.Timestamp = time.Now().UTC().Format(time.RFC3339)
	}
	h.broadcast <- msg
}

func (h *Hub) broadcastViewerCount(videoID string) {
	if videoID == "" {
		return
	}
	h.mu.RLock()
	count := len(h.rooms[videoID])
	h.mu.RUnlock()

	h.BroadcastMessage(MessagePayload{
		Type:    "viewer_count",
		VideoID: videoID,
		Count:   count,
	})
}

func (c *Client) readPump() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(4096)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var incoming struct {
			Type    string `json:"type"`
			Message string `json:"message"`
		}
		if err := json.Unmarshal(message, &incoming); err != nil {
			continue
		}

		if incoming.Type == "chat" && incoming.Message != "" {
			c.Hub.BroadcastMessage(MessagePayload{
				Type:       "chat",
				VideoID:    c.VideoID,
				SenderName: c.FullName,
				Message:    incoming.Message,
				IsAdmin:    c.IsAdmin,
			})
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(25 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)
			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[WS ERROR] Upgrade error: %v", err)
		return
	}

	videoID := r.URL.Query().Get("video_id")
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "Mwanachama"
	}
	isAdmin := r.URL.Query().Get("admin") == "true"

	client := &Client{
		Hub:      hub,
		Conn:     conn,
		Send:     make(chan []byte, 256),
		VideoID:  videoID,
		FullName: name,
		IsAdmin:  isAdmin,
	}

	hub.register <- client

	go client.writePump()
	go client.readPump()
}
