package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
	"valorant-mobile-web/backend/internal/models"
	"valorant-mobile-web/backend/internal/services"
	"valorant-mobile-web/backend/pkg/utils"

	"github.com/gorilla/mux"
)

type MatchRoomHandler struct {
	matchRoomService *services.MatchRoomService
	queueService     *services.QueueService
}

type SetCaptainSelectionRequest struct {
	Method string `json:"method"` // "voting" or "random"
}

type VoteCaptainRequest struct {
	CandidateID string `json:"candidate_id"`
}

// Remove default constructor to enforce singleton usage
// func NewMatchRoomHandler() *MatchRoomHandler {
//     return &MatchRoomHandler{
//         matchRoomService: services.NewMatchRoomService(),
//         queueService:     services.NewQueueService(),
//     }
// }

// NewMatchRoomHandlerWithServices creates a MatchRoomHandler with shared service instances
func NewMatchRoomHandlerWithServices(matchRoomService *services.MatchRoomService, queueService *services.QueueService) *MatchRoomHandler {
	return &MatchRoomHandler{
		matchRoomService: matchRoomService,
		queueService:     queueService,
	}
}

// CreateMatchRoom creates a new match room when queue is full
func (mrh *MatchRoomHandler) CreateMatchRoom(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("=== CREATE MATCH ROOM REQUEST ===\n")

	// Check if queue is ready for match
	status, err := mrh.queueService.GetQueueStatus()
	if err != nil {
		fmt.Printf("ERROR getting queue status: %v\n", err)
		utils.ErrorResponse(w, "Failed to get queue status", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Queue status - Players: %d, CanStart: %v, ShouldCreate: %v\n",
		status.PlayersInQueue, status.CanStartMatch, status.ShouldCreateMatch)

	if !status.CanStartMatch {
		fmt.Printf("ERROR: Not enough players. Need 2, have %d\n", status.PlayersInQueue) // TEMPORARY: Changed from 10 to 2
		utils.ErrorResponse(w, fmt.Sprintf("Not enough players in queue to create match. Need 2, have %d", status.PlayersInQueue), http.StatusBadRequest)
		return
	}

	fmt.Printf("Starting match room creation...\n")

	// Create match room
	match, err := mrh.matchRoomService.CreateMatchRoom()
	if err != nil {
		fmt.Printf("ERROR creating match room: %v\n", err)
		utils.ErrorResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Printf("SUCCESS: Match room created with ID: %s\n", match.ID)

	response := map[string]interface{}{
		"match": match,
	}

	fmt.Printf("SENDING RESPONSE: %+v\n", response)
	fmt.Printf("MATCH OBJECT: ID=%s, Status=%s, Players=%d\n", match.ID, match.Status, len(match.Players))

	utils.SuccessResponse(w, response)
}

// DebugMatchRoom provides debug information about the current queue state
func (mrh *MatchRoomHandler) DebugMatchRoom(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("=== DEBUG MATCH ROOM ===\n")

	// Check queue status
	status, err := mrh.queueService.GetQueueStatus()
	if err != nil {
		utils.ErrorResponse(w, fmt.Sprintf("Error getting queue status: %v", err), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"queue_status": map[string]interface{}{
			"players_in_queue":    status.PlayersInQueue,
			"can_start_match":     status.CanStartMatch,
			"should_create_match": status.ShouldCreateMatch,
			"is_queue_full":       status.IsQueueFull,
			"max_players":         status.MaxPlayers,
			"players":             status.Players,
		},
		"debug_info": map[string]interface{}{
			"timestamp": time.Now().Format("2006-01-02 15:04:05"),
			"message":   "Debug information retrieved successfully",
		},
	}

	utils.SuccessResponse(w, response)
}

// GetMatchRoom gets match room details
func (mrh *MatchRoomHandler) GetMatchRoom(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	matchID := vars["matchId"]

	if matchID == "" {
		utils.ErrorResponse(w, "Match ID is required", http.StatusBadRequest)
		return
	}

	match, err := mrh.matchRoomService.GetMatchRoom(matchID)
	if err != nil {
		utils.ErrorResponse(w, err.Error(), http.StatusNotFound)
		return
	}

	response := map[string]interface{}{
		"match": match,
	}
	utils.SuccessResponse(w, response)
}

// GetPlayerMatchRoom gets the match room that a player is currently in
func (mrh *MatchRoomHandler) GetPlayerMatchRoom(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("=== GET PLAYER MATCH ROOM REQUEST ===\n")

	userID := r.Header.Get("X-User-ID")
	fmt.Printf("User ID from header: '%s'\n", userID)

	if userID == "" {
		fmt.Printf("ERROR: User ID is missing\n")
		utils.ErrorResponse(w, "User ID is required", http.StatusBadRequest)
		return
	}

	fmt.Printf("Looking for match room for user: %s\n", userID)
	match, err := mrh.matchRoomService.GetPlayerMatchRoom(userID)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
		utils.ErrorResponse(w, err.Error(), http.StatusNotFound)
		return
	}

	fmt.Printf("SUCCESS: Found match room %s for user %s\n", match.ID, userID)
	response := map[string]interface{}{
		"match": match,
	}
	utils.SuccessResponse(w, response)
}

// SetCaptainSelectionMethod sets how captains will be selected
func (mrh *MatchRoomHandler) SetCaptainSelectionMethod(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	matchID := vars["matchId"]

	if matchID == "" {
		utils.ErrorResponse(w, "Match ID is required", http.StatusBadRequest)
		return
	}

	var req SetCaptainSelectionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var method models.CaptainSelectionMethod
	switch req.Method {
	case "voting":
		method = models.CaptainSelectionVoting
	case "random":
		method = models.CaptainSelectionRandom
	default:
		utils.ErrorResponse(w, "Invalid captain selection method", http.StatusBadRequest)
		return
	}

	err := mrh.matchRoomService.SetCaptainSelectionMethod(matchID, method)
	if err != nil {
		utils.ErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get updated match
	match, err := mrh.matchRoomService.GetMatchRoom(matchID)
	if err != nil {
		utils.ErrorResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Captain selection method set to %s", req.Method),
		"match":   match,
	}

	utils.SuccessResponse(w, response)
}

// VoteForCaptain allows a player to vote for a captain
func (mrh *MatchRoomHandler) VoteForCaptain(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	matchID := vars["matchId"]

	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.ErrorResponse(w, "User ID is required", http.StatusBadRequest)
		return
	}

	if matchID == "" {
		utils.ErrorResponse(w, "Match ID is required", http.StatusBadRequest)
		return
	}

	var req VoteCaptainRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.ErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	err := mrh.matchRoomService.VoteForCaptain(matchID, userID, req.CandidateID)
	if err != nil {
		utils.ErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Get updated match
	match, err := mrh.matchRoomService.GetMatchRoom(matchID)
	if err != nil {
		utils.ErrorResponse(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Vote recorded successfully",
		"match":   match,
	}

	utils.SuccessResponse(w, response)
}
