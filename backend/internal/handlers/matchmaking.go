package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"valorant-mobile-web/backend/internal/services"
	"valorant-mobile-web/backend/pkg/utils"
)

type MatchmakingHandler struct {
	queueService *services.QueueService
}

func NewMatchmakingHandler() *MatchmakingHandler {
	return &MatchmakingHandler{
		queueService: services.NewQueueService(),
	}
}

func (h *MatchmakingHandler) JoinQueue(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	username := r.Header.Get("X-Username")
	eloStr := r.Header.Get("X-User-ELO")

	if userID == "" {
		utils.ErrorResponse(w, "User ID required", http.StatusBadRequest)
		return
	}

	// Set default values if not provided
	if username == "" {
		username = fmt.Sprintf("Player%s", userID[len(userID)-4:])
	}

	elo := 1200 // default ELO
	if eloStr != "" {
		if parsedELO, err := strconv.Atoi(eloStr); err == nil {
			elo = parsedELO
		}
	}

	err := h.queueService.JoinQueue(userID, username, elo)
	if err != nil {
		utils.ErrorResponse(w, "Failed to join queue", http.StatusInternalServerError)
		return
	}

	utils.MessageResponse(w, "Successfully joined the queue")
}

func (h *MatchmakingHandler) LeaveQueue(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		utils.ErrorResponse(w, "User ID required", http.StatusBadRequest)
		return
	}

	err := h.queueService.LeaveQueue(userID)
	if err != nil {
		utils.ErrorResponse(w, "Failed to leave queue", http.StatusInternalServerError)
		return
	}

	utils.MessageResponse(w, "Successfully left the queue")
}
