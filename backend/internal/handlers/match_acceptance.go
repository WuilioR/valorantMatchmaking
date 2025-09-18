package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"valorant-mobile-web/backend/internal/services"
	"valorant-mobile-web/backend/pkg/utils"

	"github.com/gorilla/mux"
)

type MatchAcceptanceHandler struct {
	acceptanceService *services.MatchAcceptanceService
}

// Remove default constructor to enforce singleton usage
// func NewMatchAcceptanceHandler() *MatchAcceptanceHandler {
//     return &MatchAcceptanceHandler{
//         acceptanceService: services.NewMatchAcceptanceService(),
//     }
// }

// NewMatchAcceptanceHandlerWithService creates a MatchAcceptanceHandler with shared service instance
func NewMatchAcceptanceHandlerWithService(acceptanceService *services.MatchAcceptanceService) *MatchAcceptanceHandler {
	return &MatchAcceptanceHandler{
		acceptanceService: acceptanceService,
	}
}

type AcceptMatchRequest struct {
	UserID string `json:"user_id"`
}

func (mah *MatchAcceptanceHandler) AcceptMatch(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("=== ACCEPT MATCH HANDLER ===\n")

	vars := mux.Vars(r)
	matchID := vars["id"]

	var req AcceptMatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("Error decoding request: %v\n", err)
		utils.ErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get userID from headers if not in body
	if req.UserID == "" {
		req.UserID = r.Header.Get("X-User-ID")
	}

	if req.UserID == "" {
		utils.ErrorResponse(w, "User ID is required", http.StatusBadRequest)
		return
	}

	fmt.Printf("User %s accepting match %s\n", req.UserID, matchID)

	err := mah.acceptanceService.AcceptMatch(matchID, req.UserID)
	if err != nil {
		fmt.Printf("Error accepting match: %v\n", err)
		utils.ErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Match accepted successfully",
	}

	utils.SuccessResponse(w, response)
}

func (mah *MatchAcceptanceHandler) DeclineMatch(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("=== DECLINE MATCH HANDLER ===\n")

	vars := mux.Vars(r)
	matchID := vars["id"]

	var req AcceptMatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("Error decoding request: %v\n", err)
		utils.ErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get userID from headers if not in body
	if req.UserID == "" {
		req.UserID = r.Header.Get("X-User-ID")
	}

	if req.UserID == "" {
		utils.ErrorResponse(w, "User ID is required", http.StatusBadRequest)
		return
	}

	fmt.Printf("User %s declining match %s\n", req.UserID, matchID)

	err := mah.acceptanceService.DeclineMatch(matchID, req.UserID)
	if err != nil {
		fmt.Printf("Error declining match: %v\n", err)
		utils.ErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Match declined successfully",
	}

	utils.SuccessResponse(w, response)
}
