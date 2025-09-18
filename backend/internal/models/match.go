package models

import (
	"time"
)

type MatchStatus string

const (
	MatchStatusPending          MatchStatus = "pending"           // Esperando aceptaciones
	MatchStatusReady            MatchStatus = "ready"             // Todos aceptaron
	MatchStatusCancelled        MatchStatus = "cancelled"         // Alguien rechazó o expiró
	MatchStatusCreated          MatchStatus = "created"           // Match room created, waiting for captain selection method
	MatchStatusCaptainSelection MatchStatus = "captain_selection" // Selecting captains (voting or random)
	MatchStatusCaptainVoting    MatchStatus = "captain_voting"    // Players voting for captains
	MatchStatusTeamDraft        MatchStatus = "team_draft"        // Captains selecting teams
	MatchStatusMapBan           MatchStatus = "map_ban"           // Map banning phase
	MatchStatusOngoing          MatchStatus = "ongoing"           // Match in progress
	MatchStatusReporting        MatchStatus = "reporting"         // Reporting results
	MatchStatusCompleted        MatchStatus = "completed"         // Match finished
	MatchStatusDisputed         MatchStatus = "disputed"          // Result disputed
)

type CaptainSelectionMethod string

const (
	CaptainSelectionVoting CaptainSelectionMethod = "voting"
	CaptainSelectionRandom CaptainSelectionMethod = "random"
)

type MatchPlayer struct {
	UserID   string `json:"user_id" db:"user_id"`
	Username string `json:"username" db:"username"`
	ELO      int    `json:"elo" db:"elo"`
	Accepted bool   `json:"accepted" db:"accepted"`
	Team     string `json:"team,omitempty" db:"team"` // "A" or "B"
	Role     string `json:"role,omitempty" db:"role"` // "captain" or "player"
}

type Match struct {
	ID                     string                 `json:"id" db:"id"`
	Status                 MatchStatus            `json:"status" db:"status"`
	Players                []MatchPlayer          `json:"players" db:"players"`   // All players in the match
	Team1                  []string               `json:"team1" db:"team1"`       // Team 1 player IDs
	Team2                  []string               `json:"team2" db:"team2"`       // Team 2 player IDs
	Captain1               string                 `json:"captain1" db:"captain1"` // Team 1 captain ID
	Captain2               string                 `json:"captain2" db:"captain2"` // Team 2 captain ID
	CaptainSelectionMethod CaptainSelectionMethod `json:"captain_selection_method" db:"captain_selection_method"`
	CaptainVotes           map[string]string      `json:"captain_votes" db:"captain_votes"`           // userID -> voted_for_userID
	CaptainCandidates      []string               `json:"captain_candidates" db:"captain_candidates"` // List of captain candidates
	SelectedMap            string                 `json:"selected_map" db:"selected_map"`
	BannedMaps             []string               `json:"banned_maps" db:"banned_maps"`
	Winner                 *string                `json:"winner" db:"winner"`
	StartTime              time.Time              `json:"start_time" db:"start_time"`   // When match was found
	ExpireTime             time.Time              `json:"expire_time" db:"expire_time"` // When acceptance expires
	CreatedAt              time.Time              `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time              `json:"updated_at" db:"updated_at"`
}

type Vote struct {
	ID      string    `json:"id" db:"id"`
	MatchID string    `json:"match_id" db:"match_id"`
	UserID  string    `json:"user_id" db:"user_id"`
	Winner  string    `json:"winner" db:"winner"` // "team1", "team2", "tie"
	VotedAt time.Time `json:"voted_at" db:"voted_at"`
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
