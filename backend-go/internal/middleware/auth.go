package middleware

import (
	"context"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/sillyger/platform-backend/internal/models"
)

type contextKey string

const (
	MemberContextKey contextKey = "current_member"
)

type JWTClaims struct {
	MemberID  string            `json:"member_id"`
	RegNumber string            `json:"reg_number"`
	FullName  string            `json:"full_name"`
	Role      models.MemberRole `json:"role"`
	jwt.RegisteredClaims
}

type AuthMiddleware struct {
	jwtSecret []byte
}

func NewAuthMiddleware(secret string) *AuthMiddleware {
	return &AuthMiddleware{
		jwtSecret: []byte(secret),
	}
}

func (a *AuthMiddleware) GenerateToken(member *models.Member) (string, error) {
	claims := JWTClaims{
		MemberID:  member.ID,
		RegNumber: member.RegNumber,
		FullName:  member.FullName,
		Role:      member.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // 7 days session
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "sillyger-platform",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(a.jwtSecret)
}

func (a *AuthMiddleware) RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error":"Uthibitisho unahitajika (Authorization token missing)"}`, http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, `{"error":"Muundo wa token sio sahihi (Invalid Bearer format)"}`, http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]
		claims := &JWTClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			return a.jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, `{"error":"Token imeisha muda wake au sio sahihi (Invalid/expired token)"}`, http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), MemberContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

func (a *AuthMiddleware) RequireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return a.RequireAuth(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(MemberContextKey).(*JWTClaims)
		if !ok || (claims.Role != models.RoleAdmin && claims.Role != models.RoleSuperAdmin) {
			http.Error(w, `{"error":"Huna mamlaka ya kufanya kitendo hiki (Admin privileges required)"}`, http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Simple IP-based Rate Limiter for Brute-force protection
type RateLimiter struct {
	mu      sync.Mutex
	clients map[string][]time.Time
	limit   int
	window  time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string][]time.Time),
		limit:   limit,
		window:  window,
	}
	go rl.cleanupLoop()
	return rl
}

func (rl *RateLimiter) cleanupLoop() {
	ticker := time.NewTicker(rl.window)
	for range ticker.C {
		rl.mu.Lock()
		cutoff := time.Now().Add(-rl.window)
		for ip, timestamps := range rl.clients {
			var valid []time.Time
			for _, t := range timestamps {
				if t.After(cutoff) {
					valid = append(valid, t)
				}
			}
			if len(valid) == 0 {
				delete(rl.clients, ip)
			} else {
				rl.clients[ip] = valid
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) Limit(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if fwd := r.Header.Get("CF-Connecting-IP"); fwd != "" {
			ip = fwd // Cloudflare real IP
		} else if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
			ip = strings.Split(fwd, ",")[0]
		}

		rl.mu.Lock()
		now := time.Now()
		cutoff := now.Add(-rl.window)
		var valid []time.Time
		for _, t := range rl.clients[ip] {
			if t.After(cutoff) {
				valid = append(valid, t)
			}
		}
		if len(valid) >= rl.limit {
			rl.mu.Unlock()
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			w.Write([]byte(`{"error":"Maombi yamezidi kiwango (Too many requests). Tafadhali subiri kidogo."}`))
			return
		}
		rl.clients[ip] = append(valid, now)
		rl.mu.Unlock()

		next.ServeHTTP(w, r)
	}
}

// Security Headers Middleware
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		// Handle CORS preflight
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
