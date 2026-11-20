package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

type OutboxItem struct {
	ID            string
	TenantID      string
	SiteID        string
	LaneID        string
	EventType     string
	Payload       map[string]any
	Status        string
	Attempts      int
	NextAttemptAt time.Time
	CreatedAt     time.Time
}

type Store struct {
	db *sql.DB
}

func Open(path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, err
	}
	s := &Store{db: db}
	if err := s.migrate(context.Background()); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}

func (s *Store) migrate(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS edge_outbox (
			id TEXT PRIMARY KEY,
			tenant_id TEXT NOT NULL,
			site_id TEXT NOT NULL,
			lane_id TEXT NOT NULL,
			event_type TEXT NOT NULL,
			payload TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'PENDING',
			attempts INTEGER NOT NULL DEFAULT 0,
			next_attempt_at TEXT NOT NULL,
			created_at TEXT NOT NULL,
			sent_at TEXT
		);
		CREATE INDEX IF NOT EXISTS idx_edge_outbox_pending
		ON edge_outbox(status, next_attempt_at);
	`)
	return err
}

func (s *Store) Enqueue(ctx context.Context, item OutboxItem) error {
	if item.ID == "" || item.TenantID == "" || item.SiteID == "" || item.LaneID == "" {
		return errors.New("outbox item requires id, tenant, site and lane")
	}
	payload, err := json.Marshal(item.Payload)
	if err != nil {
		return err
	}
	now := item.CreatedAt
	if now.IsZero() {
		now = time.Now().UTC()
	}
	next := item.NextAttemptAt
	if next.IsZero() {
		next = now
	}
	status := item.Status
	if status == "" {
		status = "PENDING"
	}
	_, err = s.db.ExecContext(ctx, `
		INSERT OR IGNORE INTO edge_outbox
		(id, tenant_id, site_id, lane_id, event_type, payload, status, attempts, next_attempt_at, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
		item.ID, item.TenantID, item.SiteID, item.LaneID, item.EventType,
		string(payload), status, next.Format(time.RFC3339Nano), now.Format(time.RFC3339Nano),
	)
	return err
}

func (s *Store) Pending(ctx context.Context, limit int) ([]OutboxItem, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, tenant_id, site_id, lane_id, event_type, payload, status, attempts, next_attempt_at, created_at
		FROM edge_outbox
		WHERE status = 'PENDING' AND next_attempt_at <= ?
		ORDER BY created_at ASC
		LIMIT ?`, now, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []OutboxItem
	for rows.Next() {
		var item OutboxItem
		var payload, next, created string
		if err := rows.Scan(&item.ID, &item.TenantID, &item.SiteID, &item.LaneID, &item.EventType,
			&payload, &item.Status, &item.Attempts, &next, &created); err != nil {
			return nil, err
		}
		if err := json.Unmarshal([]byte(payload), &item.Payload); err != nil {
			return nil, err
		}
		item.NextAttemptAt, _ = time.Parse(time.RFC3339Nano, next)
		item.CreatedAt, _ = time.Parse(time.RFC3339Nano, created)
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) MarkSent(ctx context.Context, id string) error {
	result, err := s.db.ExecContext(ctx, `
		UPDATE edge_outbox SET status = 'SENT', sent_at = ?
		WHERE id = ?`, time.Now().UTC().Format(time.RFC3339Nano), id)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if count != 1 {
		return fmt.Errorf("outbox item %s was not updated", id)
	}
	return nil
}

func (s *Store) MarkRetry(ctx context.Context, id string, attempts int) error {
	delay := RetryDelay(attempts)
	next := time.Now().UTC().Add(delay)
	_, err := s.db.ExecContext(ctx, `
		UPDATE edge_outbox
		SET attempts = ?, status = 'PENDING', next_attempt_at = ?
		WHERE id = ?`,
		attempts, next.Format(time.RFC3339Nano), id,
	)
	return err
}

func RetryDelay(attempts int) time.Duration {
	switch attempts {
	case 1:
		return 2 * time.Second
	case 2:
		return 5 * time.Second
	case 3:
		return 15 * time.Second
	case 4:
		return 30 * time.Second
	default:
		return 60 * time.Second
	}
}
