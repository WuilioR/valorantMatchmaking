package services

import (
	"fmt"
	"sync"
	"time"
	"valorant-mobile-web/backend/internal/models"
)

type QueueService struct {
	queue       map[string]*models.QueueEntry
	mutex       sync.RWMutex
	maxPlayers  int
	isQueueFull bool
}

func NewQueueService() *QueueService {
	return &QueueService{
		queue:      make(map[string]*models.QueueEntry),
		maxPlayers: 2, // TEMPORARY: Changed from 10 to 2 for testing
	}
}

func (qs *QueueService) JoinQueue(userID, username string, elo int) error {
	qs.mutex.Lock()
	defer qs.mutex.Unlock()

	// Check if queue is full and a match is being created
	if qs.isQueueFull {
		return fmt.Errorf("queue is full, please wait for the current match to start")
	}

	// Check if user is already in queue
	if _, exists := qs.queue[userID]; exists {
		return fmt.Errorf("user is already in queue")
	}

	// Check if queue would exceed max players
	if len(qs.queue) >= qs.maxPlayers {
		qs.isQueueFull = true
		return fmt.Errorf("queue is full, please wait for the current match to start")
	}

	// Use provided user data instead of mock data
	qs.queue[userID] = &models.QueueEntry{
		UserID:   userID,
		Username: username,
		ELO:      elo,
		JoinedAt: time.Now(),
	}

	// Check if we've reached the max players
	if len(qs.queue) >= qs.maxPlayers {
		qs.isQueueFull = true
	}

	fmt.Printf("USER JOINED QUEUE: %s (%s) ELO: %d - Queue size: %d/%d, Full: %v\n",
		username, userID, elo, len(qs.queue), qs.maxPlayers, qs.isQueueFull)
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
	canStart := playersCount >= qs.maxPlayers

	estimatedWait := "Waiting for players..."
	if qs.isQueueFull {
		estimatedWait = "Queue is full - Match starting soon!"
	} else if playersCount >= qs.maxPlayers-2 {
		estimatedWait = fmt.Sprintf("%d more players needed", qs.maxPlayers-playersCount)
	} else if playersCount >= 1 {
		estimatedWait = fmt.Sprintf("%d more players needed", qs.maxPlayers-playersCount)
	}

	fmt.Printf("QUEUE STATUS: %d/%d players, canStart: %v, isFull: %v\n",
		playersCount, qs.maxPlayers, canStart, qs.isQueueFull)

	return &models.QueueStatus{
		PlayersInQueue:    playersCount,
		CurrentPlayers:    playersCount, // Add for frontend compatibility
		Players:           players,
		EstimatedWait:     estimatedWait,
		CanStartMatch:     canStart,
		MaxPlayers:        qs.maxPlayers,
		IsQueueFull:       qs.isQueueFull,
		ShouldCreateMatch: canStart, // Indicates frontend should create match room
	}, nil
}

func (qs *QueueService) CanStartMatch() bool {
	qs.mutex.RLock()
	defer qs.mutex.RUnlock()
	return len(qs.queue) >= qs.maxPlayers
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

	// Reset queue state after match creation
	qs.isQueueFull = false
	fmt.Printf("QUEUE RESET: Queue size: %d/%d, Full: %v\n", len(qs.queue), qs.maxPlayers, qs.isQueueFull)

	return nil
}

// ClearQueue clears the entire queue (useful for match creation)
func (qs *QueueService) ClearQueue() error {
	qs.mutex.Lock()
	defer qs.mutex.Unlock()

	qs.queue = make(map[string]*models.QueueEntry)
	qs.isQueueFull = false
	fmt.Printf("QUEUE CLEARED: New queue ready for players\n")

	return nil
}
