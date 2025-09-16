package handlers

import (
    "net/http"
    "valorant-mobile-web/backend/internal/services"
    "valorant-mobile-web/backend/pkg/utils"
)

type MatchmakingHandler struct {
    matchmakingService *services.MatchmakingService
    queueService       *services.QueueService
}

func NewMatchmakingHandler() *MatchmakingHandler {
    return &MatchmakingHandler{
        matchmakingService: services.NewMatchmakingService(),
        queueService:       services.NewQueueService(),
    }
}

func (h *MatchmakingHandler) JoinQueue(w http.ResponseWriter, r *http.Request) {
    userID := r.Header.Get("X-User-ID")
    if userID == "" {
        utils.ErrorResponse(w, "User ID required", http.StatusBadRequest)
        return
    }

    err := h.queueService.JoinQueue(userID)
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

func (h *MatchmakingHandler) StartMatch(w http.ResponseWriter, r *http.Request) {
    match, err := h.matchmakingService.CreateMatch()
    if err != nil {
        utils.ErrorResponse(w, "Failed to start match: "+err.Error(), http.StatusBadRequest)
        return
    }

    utils.SuccessResponse(w, match)
}