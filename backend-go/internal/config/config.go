package config

import (
	"os"
	"strings"
)

type Config struct {
	Port           string
	DatabaseURL    string
	JWTSecret      string
	AllowedOrigins []string
	Environment    string
}

func Load() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		// Default local PostgreSQL or Supabase direct connection string
		dbURL = "postgres://postgres:postgres@localhost:5432/sillyger?sslmode=disable"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "sillyger_ultra_secure_jwt_secret_change_in_production_key_2026"
	}

	originsRaw := os.Getenv("ALLOWED_ORIGINS")
	var origins []string
	if originsRaw != "" {
		for _, o := range strings.Split(originsRaw, ",") {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				origins = append(origins, trimmed)
			}
		}
	} else {
		origins = []string{"*"} // allows dev access, locked in production by Cloudflare WAF / CORS config
	}

	env := os.Getenv("APP_ENV")
	if env == "" {
		env = "development"
	}

	return &Config{
		Port:           port,
		DatabaseURL:    dbURL,
		JWTSecret:      jwtSecret,
		AllowedOrigins: origins,
		Environment:    env,
	}
}
