package models

import (
    "math"
)

type Elo struct {
    UserID    string  `json:"user_id"`
    Rating    float64 `json:"rating"`
    Wins      int     `json:"wins"`
    Losses    int     `json:"losses"`
    LastMatch int64   `json:"last_match"` // Timestamp of the last match
}

// CalculateNewRating calculates the new ELO rating based on the outcome of a match.
func (e *Elo) CalculateNewRating(opponentRating float64, outcome float64) float64 {
    k := 32.0 // K-factor
    expectedScore := 1 / (1 + math.Pow(10, (opponentRating-e.Rating)/400))
    newRating := e.Rating + k*(outcome-expectedScore)
    return newRating
}

// UpdateElo updates the ELO rating after a match.
func (e *Elo) UpdateElo(won bool, opponentRating float64) {
    outcome := 0.0
    if won {
        outcome = 1.0
        e.Wins++
    } else {
        outcome = 0.0
        e.Losses++
    }
    e.Rating = e.CalculateNewRating(opponentRating, outcome)
}