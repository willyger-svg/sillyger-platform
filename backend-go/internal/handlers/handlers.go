package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/sillyger/platform-backend/internal/database"
	"github.com/sillyger/platform-backend/internal/middleware"
	"github.com/sillyger/platform-backend/internal/models"
	"github.com/sillyger/platform-backend/internal/realtime"
	"golang.org/x/crypto/bcrypt"
)

type Handler struct {
	DB   *database.DB
	Hub  *realtime.Hub
	Auth *middleware.AuthMiddleware
}

func NewHandler(db *database.DB, hub *realtime.Hub, auth *middleware.AuthMiddleware) *Handler {
	return &Handler{
		DB:   db,
		Hub:  hub,
		Auth: auth,
	}
}

func jsonResponse(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func jsonError(w http.ResponseWriter, status int, message string) {
	jsonResponse(w, status, map[string]string{"error": message})
}

// Health Check
func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"service":   "SILLYGER Enterprise Go Engine",
		"version":   "2.0.0",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// Register
type RegisterRequest struct {
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Taarifa zilizotumwa sio sahihi")
		return
	}

	req.FullName = strings.TrimSpace(req.FullName)
	req.Phone = strings.TrimSpace(req.Phone)
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Password = strings.TrimSpace(req.Password)

	if req.FullName == "" || req.Phone == "" || req.Email == "" || len(req.Password) < 6 {
		jsonError(w, http.StatusBadRequest, "Tafadhali jaza taarifa zote. Nenosiri liwe na herufi 6 au zaidi.")
		return
	}

	// Normalize Tanzania phone number format
	cleanPhone := regexp.MustCompile(`[^0-9]`).ReplaceAllString(req.Phone, "")
	if strings.HasPrefix(cleanPhone, "0") {
		cleanPhone = "255" + cleanPhone[1:]
	} else if strings.HasPrefix(cleanPhone, "+255") {
		cleanPhone = cleanPhone[1:]
	}
	if !strings.HasPrefix(cleanPhone, "255") || len(cleanPhone) != 12 {
		jsonError(w, http.StatusBadRequest, "Namba ya simu lazima iwe namba halali ya Tanzania (+255).")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "Hitilafu wakati wa kusindika nenosiri.")
		return
	}

	// Insert into DB if SQL is connected, or return mock in offline dev
	var newID string
	if h.DB.SQL != nil {
		query := `
		INSERT INTO members (full_name, phone, email, password_hash, role, status)
		VALUES ($1, $2, $3, $4, 'STUDENT', 'PENDING')
		RETURNING id;
		`
		err := h.DB.SQL.QueryRow(query, req.FullName, cleanPhone, req.Email, string(hashedPassword)).Scan(&newID)
		if err != nil {
			if strings.Contains(err.Error(), "unique") {
				jsonError(w, http.StatusConflict, "Email au namba hii ya simu tayari imeshasajiliwa.")
				return
			}
			jsonError(w, http.StatusInternalServerError, "Hitilafu kwenye database: "+err.Error())
			return
		}
	} else {
		newID = "mock-student-" + fmt.Sprintf("%d", time.Now().Unix())
	}

	// Push real-time notification to admins
	h.Hub.BroadcastMessage(realtime.MessagePayload{
		Type: "notification",
		Data: map[string]interface{}{
			"title":   "Ombi Jipya la Usajili",
			"message": fmt.Sprintf("%s ameomba kujiunga na SILLYGER.", req.FullName),
			"type":    "REGISTRATION",
		},
	})

	jsonResponse(w, http.StatusCreated, map[string]interface{}{
		"message": "Usajili umefanikiwa! Ombi lako liko kwenye foleni ya kuidhinishwa na uongozi.",
		"id":      newID,
		"status":  "PENDING",
	})
}

// Login
type LoginRequest struct {
	Identifier string `json:"identifier"` // Email, phone, or reg number
	Password   string `json:"password"`
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Taarifa sio sahihi")
		return
	}

	req.Identifier = strings.TrimSpace(req.Identifier)
	req.Password = strings.TrimSpace(req.Password)

	if req.Identifier == "" || req.Password == "" {
		jsonError(w, http.StatusBadRequest, "Weka taarifa zako za kuingilia na nenosiri.")
		return
	}

	// Founder / Super-admin bypass fallback for initial bootstrap
	if req.Identifier == "wshavu@gmail.com" && req.Password == "SillygerFounder2026!" {
		founder := &models.Member{
			ID:        "founder-root-001",
			RegNumber: "SG-000001",
			FullName:  "Mwenyekiti Mwanzilishi",
			Email:     "wshavu@gmail.com",
			Phone:     "255700000000",
			Role:      models.RoleSuperAdmin,
			Status:    models.StatusActive,
		}
		token, _ := h.Auth.GenerateToken(founder)
		jsonResponse(w, http.StatusOK, map[string]interface{}{
			"token":  token,
			"member": founder,
		})
		return
	}

	var member models.Member
	if h.DB.SQL != nil {
		query := `
		SELECT id, reg_number, full_name, phone, email, password_hash, role, status, avatar_url, bio
		FROM members
		WHERE LOWER(email) = LOWER($1) OR phone = $1 OR reg_number = $1
		LIMIT 1;
		`
		var regNum sql.NullString
		err := h.DB.SQL.QueryRow(query, req.Identifier).Scan(
			&member.ID, &regNum, &member.FullName, &member.Phone, &member.Email,
			&member.PasswordHash, &member.Role, &member.Status, &member.AvatarURL, &member.Bio,
		)
		if regNum.Valid {
			member.RegNumber = regNum.String
		}

		if err != nil {
			jsonError(w, http.StatusUnauthorized, "Taarifa za kuingilia sio sahihi.")
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(member.PasswordHash), []byte(req.Password)); err != nil {
			jsonError(w, http.StatusUnauthorized, "Nenosiri sio sahihi.")
			return
		}
	} else {
		jsonError(w, http.StatusServiceUnavailable, "Database haipatikani kwa sasa.")
		return
	}

	token, err := h.Auth.GenerateToken(&member)
	if err != nil {
		jsonError(w, http.StatusInternalServerError, "Hitilafu wakati wa kutengeneza token.")
		return
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"token":  token,
		"member": member,
	})
}

// Get Current Member State
func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.MemberContextKey).(*middleware.JWTClaims)
	if !ok {
		jsonError(w, http.StatusUnauthorized, "Hujaingia kwenye mfumo.")
		return
	}

	var member models.Member
	if h.DB.SQL != nil {
		var regNum sql.NullString
		query := `
		SELECT id, reg_number, full_name, phone, email, role, status, avatar_url, bio, created_at
		FROM members WHERE id = $1;
		`
		err := h.DB.SQL.QueryRow(query, claims.MemberID).Scan(
			&member.ID, &regNum, &member.FullName, &member.Phone, &member.Email,
			&member.Role, &member.Status, &member.AvatarURL, &member.Bio, &member.CreatedAt,
		)
		if regNum.Valid {
			member.RegNumber = regNum.String
		}
		if err != nil {
			jsonError(w, http.StatusNotFound, "Mwanachama hakupatikana.")
			return
		}
	} else {
		member = models.Member{
			ID:        claims.MemberID,
			RegNumber: claims.RegNumber,
			FullName:  claims.FullName,
			Role:      claims.Role,
			Status:    models.StatusActive,
		}
	}

	jsonResponse(w, http.StatusOK, member)
}

// Announcements
func (h *Handler) GetAnnouncements(w http.ResponseWriter, r *http.Request) {
	var list []models.Announcement
	if h.DB.SQL != nil {
		rows, err := h.DB.SQL.Query(`
			SELECT id, title, content, author_name, priority, category, created_at
			FROM announcements
			ORDER BY created_at DESC
			LIMIT 20;
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var a models.Announcement
				rows.Scan(&a.ID, &a.Title, &a.Content, &a.AuthorName, &a.Priority, &a.Category, &a.CreatedAt)
				list = append(list, a)
			}
		}
	}
	if list == nil {
		list = []models.Announcement{
			{
				ID:         "init-1",
				Title:      "Karibu kwenye Mfumo Mpya wa SILLYGER (Fullstack v2.0)",
				Content:    "Mfumo umeboreshwa kwa kiwango cha juu cha Go Engine, Realtime WebSockets, na usalama thabiti.",
				AuthorName: "Uongozi wa SILLYGER",
				Priority:   "HIGH",
				Category:   "Taarifa Rasmi",
				CreatedAt:  time.Now(),
			},
		}
	}
	jsonResponse(w, http.StatusOK, list)
}

func (h *Handler) CreateAnnouncement(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.MemberContextKey).(*middleware.JWTClaims)
	var req models.Announcement
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Taarifa sio sahihi")
		return
	}

	req.Title = strings.TrimSpace(req.Title)
	req.Content = strings.TrimSpace(req.Content)
	if req.Title == "" || req.Content == "" {
		jsonError(w, http.StatusBadRequest, "Kichwa cha habari na maelezo vinahitajika.")
		return
	}
	req.AuthorName = claims.FullName
	if req.Priority == "" {
		req.Priority = "NORMAL"
	}

	if h.DB.SQL != nil {
		query := `
		INSERT INTO announcements (title, content, author_name, priority, category)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at;
		`
		err := h.DB.SQL.QueryRow(query, req.Title, req.Content, req.AuthorName, req.Priority, req.Category).
			Scan(&req.ID, &req.CreatedAt)
		if err != nil {
			jsonError(w, http.StatusInternalServerError, "Imeshindikana kuhifadhi tangazo.")
			return
		}
	} else {
		req.ID = fmt.Sprintf("anno-%d", time.Now().Unix())
		req.CreatedAt = time.Now()
	}

	// Push notification instantly to all online clients (Web & Mobile)
	h.Hub.BroadcastMessage(realtime.MessagePayload{
		Type: "notification",
		Data: map[string]interface{}{
			"title":   "Tangazo Jipya: " + req.Title,
			"message": req.Content,
			"type":    "ANNOUNCEMENT",
		},
	})

	jsonResponse(w, http.StatusCreated, req)
}

// TV Broadcast
func (h *Handler) GetTvBroadcast(w http.ResponseWriter, r *http.Request) {
	var tv models.TvBroadcast
	if h.DB.SQL != nil {
		query := `
		SELECT id, title, description, video_url, video_id, is_live, viewer_count, updated_at
		FROM tv_broadcasts
		ORDER BY updated_at DESC
		LIMIT 1;
		`
		err := h.DB.SQL.QueryRow(query).Scan(
			&tv.ID, &tv.Title, &tv.Description, &tv.VideoURL, &tv.VideoID,
			&tv.IsLive, &tv.ViewerCount, &tv.UpdatedAt,
		)
		if err != nil {
			// Default stream fallback
			tv = models.TvBroadcast{
				ID:          "default-broadcast",
				Title:       "SILLYGER TV Broadcast Channel",
				Description: "Kituo kikuu cha masomo ya moja kwa moja ya teknolojia na jumuiya ya SILLYGER.",
				VideoURL:    "https://www.youtube.com/watch?v=live_stream",
				VideoID:     "live_stream",
				IsLive:      false,
				ViewerCount: 0,
				UpdatedAt:   time.Now(),
			}
		}
	} else {
		tv = models.TvBroadcast{
			ID:          "mock-broadcast",
			Title:       "SILLYGER TV Stream",
			Description: "Kituo kikuu cha masomo ya moja kwa moja.",
			VideoURL:    "https://www.youtube.com/watch?v=jfKfPfyJRdk",
			VideoID:     "jfKfPfyJRdk",
			IsLive:      false,
			ViewerCount: 12,
			UpdatedAt:   time.Now(),
		}
	}
	jsonResponse(w, http.StatusOK, tv)
}

func (h *Handler) SetTvBroadcast(w http.ResponseWriter, r *http.Request) {
	var req models.TvBroadcast
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, http.StatusBadRequest, "Taarifa sio sahihi")
		return
	}

	req.UpdatedAt = time.Now()
	if h.DB.SQL != nil {
		query := `
		INSERT INTO tv_broadcasts (title, description, video_url, video_id, is_live, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id;
		`
		h.DB.SQL.QueryRow(query, req.Title, req.Description, req.VideoURL, req.VideoID, req.IsLive, req.UpdatedAt).Scan(&req.ID)
	}

	// Instant live alert to all connected apps & web viewers!
	h.Hub.BroadcastMessage(realtime.MessagePayload{
		Type:    "live_status",
		VideoID: req.VideoID,
		Data: map[string]interface{}{
			"is_live":   req.IsLive,
			"title":     req.Title,
			"video_id":  req.VideoID,
			"video_url": req.VideoURL,
		},
	})

	jsonResponse(w, http.StatusOK, req)
}

// Admin Queue & Approval
func (h *Handler) GetPendingMembers(w http.ResponseWriter, r *http.Request) {
	var list []models.Member
	if h.DB.SQL != nil {
		rows, err := h.DB.SQL.Query(`
			SELECT id, full_name, phone, email, status, created_at
			FROM members
			WHERE status = 'PENDING'
			ORDER BY created_at ASC;
		`)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var m models.Member
				rows.Scan(&m.ID, &m.FullName, &m.Phone, &m.Email, &m.Status, &m.CreatedAt)
				list = append(list, m)
			}
		}
	}
	if list == nil {
		list = []models.Member{}
	}
	jsonResponse(w, http.StatusOK, list)
}

func (h *Handler) ApproveMember(w http.ResponseWriter, r *http.Request) {
	memberID := r.URL.Query().Get("id")
	if memberID == "" {
		jsonError(w, http.StatusBadRequest, "ID ya mwanachama inahitajika.")
		return
	}

	var generatedRegNum string
	if h.DB.SQL != nil {
		// Generate sequential SG-000001 format
		var count int
		h.DB.SQL.QueryRow("SELECT COUNT(*) FROM members WHERE reg_number IS NOT NULL").Scan(&count)
		generatedRegNum = fmt.Sprintf("SG-%06d", count+1)

		_, err := h.DB.SQL.Exec(`
			UPDATE members
			SET status = 'ACTIVE', reg_number = $1, updated_at = NOW()
			WHERE id = $2;
		`, generatedRegNum, memberID)
		if err != nil {
			jsonError(w, http.StatusInternalServerError, "Imeshindikana kuidhinisha mwanachama.")
			return
		}
	} else {
		generatedRegNum = "SG-000001"
	}

	jsonResponse(w, http.StatusOK, map[string]interface{}{
		"message":    "Mwanachama ameidhinishwa kikamilifu!",
		"reg_number": generatedRegNum,
		"status":     "ACTIVE",
	})
}
