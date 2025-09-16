package models

import (
	"time"
)

type QueueEntry struct {
	UserID   string    `json:"user_id" db:"user_id"`
	Username string    `json:"username" db:"username"`
	ELO      int       `json:"elo" db:"elo"`
	JoinedAt time.Time `json:"joined_at" db:"joined_at"`
}

type QueueStatus struct {
	PlayersInQueue int          `json:"players_in_queue"`
	Players        []QueueEntry `json:"players"`
	EstimatedWait  string       `json:"estimated_wait"`
	CanStartMatch  bool         `json:"can_start_match"`
	MaxPlayers     int          `json:"max_players"`
	IsQueueFull    bool         `json:"is_queue_full"`
}
