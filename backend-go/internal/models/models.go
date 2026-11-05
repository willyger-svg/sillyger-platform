package models

import (
	"time"
)

type MemberRole string
const (
	RoleStudent    MemberRole = "STUDENT"
	RoleLeader     MemberRole = "LEADER"
	RoleAdmin      MemberRole = "ADMIN"
	RoleSuperAdmin MemberRole = "SUPER_ADMIN"
)

type MemberStatus string
const (
	StatusPending   MemberStatus = "PENDING"
	StatusActive    MemberStatus = "ACTIVE"
	StatusSuspended MemberStatus = "SUSPENDED"
)

type Member struct {
	ID           string       `json:"id"`
	RegNumber    string       `json:"reg_number"`
	FullName     string       `json:"full_name"`
	Phone        string       `json:"phone"`
	Email        string       `json:"email"`
	PasswordHash string       `json:"-"`
	Role         MemberRole   `json:"role"`
	Status       MemberStatus `json:"status"`
	AvatarURL    string       `json:"avatar_url"`
	Bio          string       `json:"bio"`
	CreatedAt    time.Time    `json:"created_at"`
	UpdatedAt    time.Time    `json:"updated_at"`
}

type Announcement struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	AuthorName string    `json:"author_name"`
	Priority   string    `json:"priority"` // 'NORMAL', 'HIGH', 'URGENT'
	Category   string    `json:"category"`
	CreatedAt  time.Time `json:"created_at"`
}

type TvBroadcast struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	VideoURL    string    `json:"video_url"`
	VideoID     string    `json:"video_id"`
	IsLive      bool      `json:"is_live"`
	ViewerCount int       `json:"viewer_count"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type TvChatMessage struct {
	ID         string    `json:"id"`
	VideoID    string    `json:"video_id"`
	MemberID   string    `json:"member_id,omitempty"`
	SenderName string    `json:"sender_name"`
	Message    string    `json:"message"`
	IsAdmin    bool      `json:"is_admin"`
	CreatedAt  time.Time `json:"created_at"`
}

type Notification struct {
	ID        string    `json:"id"`
	MemberID  string    `json:"member_id,omitempty"` // empty for broadcast to all
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Type      string    `json:"type"` // ANNOUNCEMENT, VIDEO, CHAT, SYSTEM
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

type AttendanceRecord struct {
	ID           string    `json:"id"`
	MemberID     string    `json:"member_id"`
	MemberName   string    `json:"member_name,omitempty"`
	SessionTitle string    `json:"session_title"`
	SessionDate  string    `json:"session_date"`
	CheckinTime  time.Time `json:"checkin_time"`
	Status       string    `json:"status"`
}

type OverviewStats struct {
	TotalMembers    int `json:"total_members"`
	ActiveMembers   int `json:"active_members"`
	PendingMembers  int `json:"pending_members"`
	TotalBroadcasts int `json:"total_broadcasts"`
}
