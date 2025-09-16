package models

import (
    "time"
)

type MatchStatus string

const (
    MatchStatusDraft     MatchStatus = "draft"
    MatchStatusMapBan    MatchStatus = "map_ban"
    MatchStatusOngoing   MatchStatus = "ongoing"
    MatchStatusReporting MatchStatus = "reporting"
    MatchStatusCompleted MatchStatus = "completed"
    MatchStatusDisputed  MatchStatus = "disputed"
)

type Match struct {
    ID          string      `json:"id" db:"id"`
    Status      MatchStatus `json:"status" db:"status"`
    Team1       []string    `json:"team1" db:"team1"`
    Team2       []string    `json:"team2" db:"team2"`
    Captain1    string      `json:"captain1" db:"captain1"`
    Captain2    string      `json:"captain2" db:"captain2"`
    SelectedMap string      `json:"selected_map" db:"selected_map"`
    BannedMaps  []string    `json:"banned_maps" db:"banned_maps"`
    Winner      *string     `json:"winner" db:"winner"`
    CreatedAt   time.Time   `json:"created_at" db:"created_at"`
    UpdatedAt   time.Time   `json:"updated_at" db:"updated_at"`
}

type Vote struct {
    ID       string    `json:"id" db:"id"`
    MatchID  string    `json:"match_id" db:"match_id"`
    UserID   string    `json:"user_id" db:"user_id"`
    Winner   string    `json:"winner" db:"winner"` // "team1", "team2", "tie"
    VotedAt  time.Time `json:"voted_at" db:"voted_at"`
}

// Mapas de Valorant disponibles
var ValorantMaps = []string{
    "ascent",
    "bind",
    "haven",
    "split",
    "icebox",
    "breeze",
    "fracture",
    "pearl",
    "lotus",
    "sunset",
}