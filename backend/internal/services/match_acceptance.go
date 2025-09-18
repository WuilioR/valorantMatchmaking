package services

import (
	"fmt"
	"time"
	"valorant-mobile-web/backend/internal/models"
)

type MatchAcceptanceService struct {
	matchRoomService *MatchRoomService
	queueService     *QueueService
}

// Remove default constructor to enforce singleton usage
// func NewMatchAcceptanceService() *MatchAcceptanceService {
//     return &MatchAcceptanceService{
//         matchRoomService: NewMatchRoomService(),
//         queueService:     NewQueueService(),
//     }
// }

func (mas *MatchAcceptanceService) AcceptMatch(matchID, userID string) error {
	fmt.Printf("=== ACCEPT MATCH: User %s accepting match %s ===\n", userID, matchID)

	match, err := mas.matchRoomService.GetMatchRoom(matchID)
	if err != nil {
		return fmt.Errorf("match not found: %v", err)
	}

	if match.Status != models.MatchStatusPending {
		return fmt.Errorf("match is not in pending state")
	}

	// Check if match has expired
	if time.Now().After(match.ExpireTime) {
		return mas.cancelExpiredMatch(matchID)
	}

	// Find and update player
	playerFound := false
	for i, player := range match.Players {
		if player.UserID == userID {
			match.Players[i].Accepted = true
			playerFound = true
			fmt.Printf("Player %s (%s) accepted match %s\n", player.Username, userID, matchID)
			break
		}
	}

	if !playerFound {
		return fmt.Errorf("player not found in match")
	}

	// Check if all players have accepted
	allAccepted := true
	acceptedCount := 0
	for _, player := range match.Players {
		if player.Accepted {
			acceptedCount++
		} else {
			allAccepted = false
		}
	}

	fmt.Printf("Match %s: %d/%d players accepted\n", matchID, acceptedCount, len(match.Players))

	// Update match status if all accepted
	if allAccepted {
		match.Status = models.MatchStatusReady
		match.UpdatedAt = time.Now()
		fmt.Printf("🎉 All players accepted match %s! Moving to captain selection...\n", matchID)
	}

	// Save updated match
	return mas.matchRoomService.UpdateMatchRoom(match)
}

func (mas *MatchAcceptanceService) DeclineMatch(matchID, userID string) error {
	fmt.Printf("=== DECLINE MATCH: User %s declining match %s ===\n", userID, matchID)

	match, err := mas.matchRoomService.GetMatchRoom(matchID)
	if err != nil {
		return fmt.Errorf("match not found: %v", err)
	}

	if match.Status != models.MatchStatusPending {
		return fmt.Errorf("match is not in pending state")
	}

	// Cancel the match
	match.Status = models.MatchStatusCancelled
	match.UpdatedAt = time.Now()

	fmt.Printf("❌ Match %s cancelled by user %s\n", matchID, userID)

	// Return all players to queue
	return mas.returnPlayersToQueue(match.Players)
}

func (mas *MatchAcceptanceService) CheckExpiredMatches() error {
	// This would run periodically to check for expired matches
	// For now, it's called when needed
	return nil
}

func (mas *MatchAcceptanceService) cancelExpiredMatch(matchID string) error {
	match, err := mas.matchRoomService.GetMatchRoom(matchID)
	if err != nil {
		return err
	}

	match.Status = models.MatchStatusCancelled
	match.UpdatedAt = time.Now()

	fmt.Printf("⏰ Match %s expired and was cancelled\n", matchID)

	return mas.returnPlayersToQueue(match.Players)
}

func (mas *MatchAcceptanceService) returnPlayersToQueue(players []models.MatchPlayer) error {
	fmt.Printf("🔄 Returning %d players to queue...\n", len(players))

	for _, player := range players {
		err := mas.queueService.JoinQueue(player.UserID, player.Username, player.ELO)
		if err != nil {
			fmt.Printf("Warning: Could not return player %s to queue: %v\n", player.Username, err)
		} else {
			fmt.Printf("✅ Player %s returned to queue\n", player.Username)
		}
	}

	return nil
}
