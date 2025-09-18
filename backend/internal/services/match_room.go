package services

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
	"valorant-mobile-web/backend/internal/models"
)

type MatchRoomService struct {
	rooms        map[string]*models.Match
	mutex        sync.RWMutex
	queueService *QueueService
}

func NewMatchRoomService() *MatchRoomService {
	return &MatchRoomService{
		rooms:        make(map[string]*models.Match),
		queueService: NewQueueService(),
	}
}

// NewMatchRoomServiceWithQueue creates a MatchRoomService with a shared QueueService instance
func NewMatchRoomServiceWithQueue(queueService *QueueService) *MatchRoomService {
	return &MatchRoomService{
		rooms:        make(map[string]*models.Match),
		queueService: queueService,
	}
}

// CreateMatchRoom creates a new match room when queue is full
func (mrs *MatchRoomService) CreateMatchRoom() (*models.Match, error) {
	mrs.mutex.Lock()
	defer mrs.mutex.Unlock()

	fmt.Printf("=== MATCH ROOM SERVICE: Starting CreateMatchRoom ===\n")

	// Get players from queue
	players, err := mrs.queueService.GetQueuedPlayers(2) // TEMPORARY: Changed from 10 to 2
	if err != nil {
		fmt.Printf("ERROR getting queued players: %v\n", err)
		return nil, err
	}

	fmt.Printf("Retrieved %d players from queue\n", len(players))

	if len(players) < 2 { // TEMPORARY: Changed from 10 to 2
		fmt.Printf("ERROR: Not enough players. Need 2, have %d\n", len(players))
		return nil, fmt.Errorf("not enough players in queue")
	}

	// CRITICAL: Remove players from queue IMMEDIATELY to prevent race conditions
	playerIDs := make([]string, len(players))
	for i, player := range players {
		playerIDs[i] = player.UserID
	}

	fmt.Printf("Removing players from queue immediately to prevent race conditions...\n")
	err = mrs.queueService.RemovePlayersFromQueue(playerIDs)
	if err != nil {
		fmt.Printf("ERROR removing players from queue: %v\n", err)
		return nil, fmt.Errorf("failed to remove players from queue: %v", err)
	}
	fmt.Printf("Players removed from queue successfully\n")

	fmt.Printf("Creating match room for %d players...\n", len(players))

	// Generate unique match ID
	matchID := fmt.Sprintf("match-%d-%d", time.Now().Unix(), rand.Intn(10000))
	fmt.Printf("Generated match ID: %s\n", matchID)

	// Convert QueueEntry to MatchPlayer
	matchPlayers := make([]models.MatchPlayer, len(players))
	for i, player := range players {
		matchPlayers[i] = models.MatchPlayer{
			UserID:   player.UserID,
			Username: player.Username,
			ELO:      player.ELO,
			Accepted: false, // Initially all players need to accept
			Team:     "",
			Role:     "",
		}
	}

	// Create match room with pending status
	match := &models.Match{
		ID:                     matchID,
		Status:                 models.MatchStatusPending, // Start with pending status
		Players:                matchPlayers,
		Team1:                  []string{},
		Team2:                  []string{},
		Captain1:               "",
		Captain2:               "",
		CaptainSelectionMethod: "", // Will be set by players
		CaptainVotes:           make(map[string]string),
		CaptainCandidates:      []string{},
		SelectedMap:            "",
		BannedMaps:             []string{},
		Winner:                 nil,
		StartTime:              time.Now(),
		ExpireTime:             time.Now().Add(15 * time.Second), // 15 seconds to accept
		CreatedAt:              time.Now(),
		UpdatedAt:              time.Now(),
	}

	fmt.Printf("Match object created successfully\n")

	// Store match room
	mrs.rooms[matchID] = match
	fmt.Printf("Match stored in rooms map\n")

	fmt.Printf("MATCH ROOM CREATED: %s with %d players\n", matchID, len(players))
	return match, nil
}

// UpdateMatchRoom updates an existing match room
func (mrs *MatchRoomService) UpdateMatchRoom(match *models.Match) error {
	mrs.mutex.Lock()
	defer mrs.mutex.Unlock()

	match.UpdatedAt = time.Now()
	mrs.rooms[match.ID] = match

	acceptedCount := mrs.countAcceptedPlayers(match)
	fmt.Printf("MATCH UPDATED: %s - Status: %s, Players accepted: %d/%d\n",
		match.ID, match.Status, acceptedCount, len(match.Players))

	return nil
}

// countAcceptedPlayers counts how many players have accepted the match
func (mrs *MatchRoomService) countAcceptedPlayers(match *models.Match) int {
	count := 0
	for _, player := range match.Players {
		if player.Accepted {
			count++
		}
	}
	return count
}

// GetMatchRoom gets a match room by ID
func (mrs *MatchRoomService) GetMatchRoom(matchID string) (*models.Match, error) {
	mrs.mutex.RLock()
	defer mrs.mutex.RUnlock()

	match, exists := mrs.rooms[matchID]
	if !exists {
		return nil, fmt.Errorf("match room not found")
	}

	return match, nil
}

// SetCaptainSelectionMethod sets how captains will be selected
func (mrs *MatchRoomService) SetCaptainSelectionMethod(matchID string, method models.CaptainSelectionMethod) error {
	mrs.mutex.Lock()
	defer mrs.mutex.Unlock()

	match, exists := mrs.rooms[matchID]
	if !exists {
		return fmt.Errorf("match room not found")
	}

	match.CaptainSelectionMethod = method
	match.UpdatedAt = time.Now()

	if method == models.CaptainSelectionRandom {
		// Randomly select 2 captains
		return mrs.selectRandomCaptains(match)
	} else if method == models.CaptainSelectionVoting {
		// Start voting phase
		match.Status = models.MatchStatusCaptainVoting
		// All players are potential captain candidates
		for _, player := range match.Players {
			match.CaptainCandidates = append(match.CaptainCandidates, player.UserID)
		}
	}

	fmt.Printf("CAPTAIN SELECTION METHOD SET: %s for match %s\n", method, matchID)
	return nil
}

// selectRandomCaptains randomly selects 2 captains from the players
func (mrs *MatchRoomService) selectRandomCaptains(match *models.Match) error {
	if len(match.Players) < 2 {
		return fmt.Errorf("not enough players to select captains")
	}

	// Shuffle players and select first 2 as captains
	shuffled := make([]models.MatchPlayer, len(match.Players))
	copy(shuffled, match.Players)

	for i := range shuffled {
		j := rand.Intn(i + 1)
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	}

	match.Captain1 = shuffled[0].UserID
	match.Captain2 = shuffled[1].UserID
	match.Status = models.MatchStatusTeamDraft
	match.UpdatedAt = time.Now()

	fmt.Printf("RANDOM CAPTAINS SELECTED: %s and %s for match %s\n",
		match.Captain1, match.Captain2, match.ID)
	return nil
}

// VoteForCaptain allows a player to vote for a captain
func (mrs *MatchRoomService) VoteForCaptain(matchID, voterID, candidateID string) error {
	mrs.mutex.Lock()
	defer mrs.mutex.Unlock()

	match, exists := mrs.rooms[matchID]
	if !exists {
		return fmt.Errorf("match room not found")
	}

	if match.Status != models.MatchStatusCaptainVoting {
		return fmt.Errorf("not in captain voting phase")
	}

	// Verify voter is in the match
	voterInMatch := false
	for _, player := range match.Players {
		if player.UserID == voterID {
			voterInMatch = true
			break
		}
	}
	if !voterInMatch {
		return fmt.Errorf("voter not in match")
	}

	// Verify candidate is valid
	candidateValid := false
	for _, candidate := range match.CaptainCandidates {
		if candidate == candidateID {
			candidateValid = true
			break
		}
	}
	if !candidateValid {
		return fmt.Errorf("invalid captain candidate")
	}

	// Record vote
	match.CaptainVotes[voterID] = candidateID
	match.UpdatedAt = time.Now()

	fmt.Printf("CAPTAIN VOTE: %s voted for %s in match %s\n", voterID, candidateID, matchID)

	// Check if all players have voted
	if len(match.CaptainVotes) == len(match.Players) {
		return mrs.finalizeCaptainVoting(match)
	}

	return nil
}

// finalizeCaptainVoting counts votes and selects captains
func (mrs *MatchRoomService) finalizeCaptainVoting(match *models.Match) error {
	// Count votes
	voteCount := make(map[string]int)
	for _, candidate := range match.CaptainVotes {
		voteCount[candidate]++
	}

	// Find top 2 candidates
	type candidateVotes struct {
		userID string
		votes  int
	}

	var candidates []candidateVotes
	for userID, votes := range voteCount {
		candidates = append(candidates, candidateVotes{userID, votes})
	}

	// Sort by votes (descending)
	for i := 0; i < len(candidates)-1; i++ {
		for j := i + 1; j < len(candidates); j++ {
			if candidates[i].votes < candidates[j].votes {
				candidates[i], candidates[j] = candidates[j], candidates[i]
			}
		}
	}

	if len(candidates) >= 2 {
		match.Captain1 = candidates[0].userID
		match.Captain2 = candidates[1].userID
	} else if len(candidates) == 1 {
		match.Captain1 = candidates[0].userID
		// Select random second captain
		for _, player := range match.Players {
			if player.UserID != match.Captain1 {
				match.Captain2 = player.UserID
				break
			}
		}
	}

	match.Status = models.MatchStatusTeamDraft
	match.UpdatedAt = time.Now()

	fmt.Printf("CAPTAINS SELECTED BY VOTING: %s and %s for match %s\n",
		match.Captain1, match.Captain2, match.ID)
	return nil
}

// GetPlayerMatchRoom finds which match room a player is in
func (mrs *MatchRoomService) GetPlayerMatchRoom(userID string) (*models.Match, error) {
	mrs.mutex.RLock()
	defer mrs.mutex.RUnlock()

	for _, match := range mrs.rooms {
		for _, player := range match.Players {
			if player.UserID == userID {
				return match, nil
			}
		}
	}

	return nil, fmt.Errorf("player not in any match room")
}

// ListActiveRooms lists all active match rooms
func (mrs *MatchRoomService) ListActiveRooms() []*models.Match {
	mrs.mutex.RLock()
	defer mrs.mutex.RUnlock()

	var rooms []*models.Match
	for _, room := range mrs.rooms {
		rooms = append(rooms, room)
	}

	return rooms
}

// CleanupExpiredRooms removes expired match rooms
func (mrs *MatchRoomService) CleanupExpiredRooms() {
	mrs.mutex.Lock()
	defer mrs.mutex.Unlock()

	now := time.Now()
	for matchID, match := range mrs.rooms {
		if now.After(match.ExpireTime) {
			delete(mrs.rooms, matchID)
			fmt.Printf("EXPIRED MATCH ROOM REMOVED: %s\n", matchID)
		}
	}
}
