package services

import (
	"fmt"
	"sync"
	"time"
	"valorant-mobile-web/backend/internal/models"
)

type QueueService struct {
	queue map[string]*models.QueueEntry
	mutex sync.RWMutex
}

func NewQueueService() *QueueService {
	return &QueueService{
		queue: make(map[string]*models.QueueEntry),
	}
}

func (qs *QueueService) JoinQueue(userID string) error {
	qs.mutex.Lock()
	defer qs.mutex.Unlock()

	mockUsers := map[string]struct {
		username string
		elo      int
	}{
		"mock-user-id": {"TestUser1", 1250},
		"user-2":       {"TestUser2", 1180},
		"user-3":       {"ProPlayer", 1850},
		"user-4":       {"Newbie", 950},
	}

	userData, exists := mockUsers[userID]
	if !exists {
		userData = struct {
			username string
			elo      int
		}{"Player" + userID[len(userID)-3:], 1200}
	}

	qs.queue[userID] = &models.QueueEntry{
		UserID:   userID,
		Username: userData.username,
		ELO:      userData.elo,
		JoinedAt: time.Now(),
	}

	fmt.Printf("USER JOINED QUEUE: %s (%s) - Queue size: %d\n", userData.username, userID, len(qs.queue))
	return nil
}

func (qs *QueueService) LeaveQueue(userID string) error {
	qs.mutex.Lock()
	defer qs.mutex.Unlock()

	if entry, exists := qs.queue[userID]; exists {
		delete(qs.queue, userID)
		fmt.Printf("USER LEFT QUEUE: %s (%s) - Queue size: %d\n", entry.Username, userID, len(qs.queue))
	}

	return nil
}

func (qs *QueueService) GetQueueStatus() (*models.QueueStatus, error) {
	qs.mutex.RLock()
	defer qs.mutex.RUnlock()

	var players []models.QueueEntry
	for _, entry := range qs.queue {
		players = append(players, *entry)
	}

	playersCount := len(players)
	canStart := playersCount >= 2

	estimatedWait := "Waiting for players..."
	if playersCount >= 2 {
		estimatedWait = "Match starting soon!"
	} else if playersCount >= 1 {
		estimatedWait = "1 more player needed"
	}

	fmt.Printf("QUEUE STATUS: %d players, canStart: %v\n", playersCount, canStart)

	return &models.QueueStatus{
		PlayersInQueue: playersCount,
		Players:        players,
		EstimatedWait:  estimatedWait,
		CanStartMatch:  canStart,
	}, nil
}

func (qs *QueueService) CanStartMatch() bool {
	qs.mutex.RLock()
	defer qs.mutex.RUnlock()
	return len(qs.queue) >= 2
}

func (qs *QueueService) GetQueuedPlayers(limit int) ([]models.QueueEntry, error) {
	qs.mutex.RLock()
	defer qs.mutex.RUnlock()

	var players []models.QueueEntry
	count := 0
	for _, entry := range qs.queue {
		if count >= limit {
			break
		}
		players = append(players, *entry)
		count++
	}

	fmt.Printf("GETTING PLAYERS FOR MATCH: Found %d players\n", len(players))
	return players, nil
}

func (qs *QueueService) RemovePlayersFromQueue(userIDs []string) error {
	qs.mutex.Lock()
	defer qs.mutex.Unlock()

	for _, userID := range userIDs {
		if entry, exists := qs.queue[userID]; exists {
			delete(qs.queue, userID)
			fmt.Printf("REMOVED FROM QUEUE FOR MATCH: %s (%s)\n", entry.Username, userID)
		}
	}

	return nil
}
