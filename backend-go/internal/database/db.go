package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/lib/pq"
)

type DB struct {
	SQL *sql.DB
}

func Connect(dbURL string) (*DB, error) {
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		log.Printf("[WARNING] Database ping failed (%v). Operating in offline/mock mode or awaiting connection.", err)
		return &DB{SQL: nil}, nil
	}

	log.Println("[INFO] Successfully connected to PostgreSQL Database.")

	dbWrapper := &DB{SQL: db}
	if err := dbWrapper.initTables(); err != nil {
		log.Printf("[WARNING] Failed to run auto-migrations: %v", err)
	}

	return dbWrapper, nil
}

func (d *DB) initTables() error {
	if d.SQL == nil {
		return nil
	}

	schema := `
	CREATE TABLE IF NOT EXISTS members (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		reg_number VARCHAR(64) UNIQUE,
		full_name VARCHAR(255) NOT NULL,
		phone VARCHAR(32) UNIQUE NOT NULL,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash TEXT NOT NULL,
		role VARCHAR(32) DEFAULT 'STUDENT',
		status VARCHAR(32) DEFAULT 'PENDING',
		avatar_url TEXT DEFAULT '',
		bio TEXT DEFAULT '',
		created_at TIMESTAMPTZ DEFAULT NOW(),
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS announcements (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		title VARCHAR(255) NOT NULL,
		content TEXT NOT NULL,
		author_name VARCHAR(255) DEFAULT 'Uongozi wa SILLYGER',
		priority VARCHAR(32) DEFAULT 'NORMAL',
		category VARCHAR(64) DEFAULT 'General',
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS tv_broadcasts (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		title VARCHAR(255) NOT NULL,
		description TEXT DEFAULT '',
		video_url TEXT NOT NULL,
		video_id VARCHAR(64) NOT NULL,
		is_live BOOLEAN DEFAULT false,
		viewer_count INT DEFAULT 0,
		updated_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS tv_chat_messages (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		video_id VARCHAR(64) NOT NULL,
		member_id VARCHAR(64),
		sender_name VARCHAR(255) NOT NULL,
		message TEXT NOT NULL,
		is_admin BOOLEAN DEFAULT false,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS notifications (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		member_id VARCHAR(64),
		title VARCHAR(255) NOT NULL,
		message TEXT NOT NULL,
		type VARCHAR(32) DEFAULT 'SYSTEM',
		is_read BOOLEAN DEFAULT false,
		created_at TIMESTAMPTZ DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS attendance (
		id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
		member_id UUID REFERENCES members(id) ON DELETE CASCADE,
		session_title VARCHAR(255) NOT NULL,
		session_date VARCHAR(32) NOT NULL,
		checkin_time TIMESTAMPTZ DEFAULT NOW(),
		status VARCHAR(32) DEFAULT 'PRESENT'
	);
	`
	_, err := d.SQL.Exec(schema)
	return err
}
