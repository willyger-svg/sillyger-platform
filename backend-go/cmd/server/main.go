package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/sillyger/platform-backend/internal/config"
	"github.com/sillyger/platform-backend/internal/database"
	"github.com/sillyger/platform-backend/internal/handlers"
	"github.com/sillyger/platform-backend/internal/middleware"
	"github.com/sillyger/platform-backend/internal/realtime"
)

func main() {
	log.Println("[BOOT] Inazindua SILLYGER Enterprise Go Core Engine v2.0...")

	cfg := config.Load()

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Printf("[DATABASE] Onyo: %v", err)
	}

	hub := realtime.NewHub()
	go hub.Run()

	auth := middleware.NewAuthMiddleware(cfg.JWTSecret)
	rateLimiter := middleware.NewRateLimiter(60, 1*time.Minute) // 60 requests per minute per IP

	h := handlers.NewHandler(db, hub, auth)

	mux := http.NewServeMux()

	// Public Health
	mux.HandleFunc("/api/health", h.Health)

	// Auth Endpoints
	mux.HandleFunc("/api/auth/register", rateLimiter.Limit(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}
		h.Register(w, r)
	}))

	mux.HandleFunc("/api/auth/login", rateLimiter.Limit(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}
		h.Login(w, r)
	}))

	mux.HandleFunc("/api/auth/me", func(w http.ResponseWriter, r *http.Request) {
		auth.RequireAuth(h.GetMe)(w, r)
	})

	// Announcements
	mux.HandleFunc("/api/announcements", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.GetAnnouncements(w, r)
		case http.MethodPost:
			auth.RequireAdmin(h.CreateAnnouncement)(w, r)
		default:
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})

	// TV Broadcast
	mux.HandleFunc("/api/tv/broadcast", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			h.GetTvBroadcast(w, r)
		case http.MethodPost:
			auth.RequireAdmin(h.SetTvBroadcast)(w, r)
		default:
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
		}
	})

	// Admin Approval Queue
	mux.HandleFunc("/api/admin/pending", func(w http.ResponseWriter, r *http.Request) {
		auth.RequireAdmin(h.GetPendingMembers)(w, r)
	})

	mux.HandleFunc("/api/admin/approve", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, `{"error":"Method not allowed"}`, http.StatusMethodNotAllowed)
			return
		}
		auth.RequireAdmin(h.ApproveMember)(w, r)
	})

	// Realtime WebSocket Endpoint
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		realtime.ServeWs(hub, w, r)
	})

	// Root Handler
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"service":"SILLYGER Enterprise Core API","version":"2.0.0","docs":"/api/health"}`))
			return
		}
		http.NotFound(w, r)
	})

	// Wrap entire router with Security Headers & CORS
	handler := middleware.SecurityHeaders(mux)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown handling
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		log.Printf("[START] SILLYGER Go Engine inakimbia kwenye port %s...\n", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[FATAL] Server crash: %v", err)
		}
	}()

	<-stop
	log.Println("[SHUTDOWN] Inazima seva kwa usalama...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("[ERROR] Hitilafu wakati wa kuzima: %v", err)
	}

	log.Println("[INFO] Seva imezimwa kikamilifu.")
}
