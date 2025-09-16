package models

import (
	"time"
)

type User struct {
	ID        string    `json:"id" db:"id"`
	Username  string    `json:"username" db:"username"`
	Email     string    `json:"email" db:"email"`
	Password  string    `json:"-" db:"password"` // No incluir en JSON response
	ELO       int       `json:"elo" db:"elo"`
	Wins      int       `json:"wins" db:"wins"`
	Losses    int       `json:"losses" db:"losses"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

type UserStats struct {
	User
	WinRate    float64 `json:"win_rate"`
	GamesTotal int     `json:"games_total"`
	Rank       int     `json:"rank"`
}
