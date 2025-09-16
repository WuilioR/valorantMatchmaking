package handlers

import (
    "net/http"
    "valorant-mobile-web/backend/internal/services"
    "valorant-mobile-web/backend/pkg/utils"
)

type QueueHandler struct {
    queueService *services.QueueService
}

func NewQueueHandler() *QueueHandler {
    return &QueueHandler{
        queueService: services.NewQueueService(),
    }
}

func (qh *QueueHandler) JoinQueue(w http.ResponseWriter, r *http.Request) {
    userID := r.Header.Get("X-User-ID") // From auth middleware
    if userID == "" {
        utils.ErrorResponse(w, "Unauthorized - User ID required", http.StatusUnauthorized)
        return
    }
    
    err := qh.queueService.JoinQueue(userID)
    if err != nil {
        utils.ErrorResponse(w, "Failed to join queue", http.StatusInternalServerError)
        return
    }
    
    utils.MessageResponse(w, "Successfully joined queue")
}

func (qh *QueueHandler) LeaveQueue(w http.ResponseWriter, r *http.Request) {
    userID := r.Header.Get("X-User-ID")
    if userID == "" {
        utils.ErrorResponse(w, "Unauthorized - User ID required", http.StatusUnauthorized)
        return
    }
    
    err := qh.queueService.LeaveQueue(userID)
    if err != nil {
        utils.ErrorResponse(w, "Failed to leave queue", http.StatusInternalServerError)
        return
    }
    
    utils.MessageResponse(w, "Successfully left queue")
}

func (qh *QueueHandler) GetQueueStatus(w http.ResponseWriter, r *http.Request) {
    status, err := qh.queueService.GetQueueStatus()
    if err != nil {
        utils.ErrorResponse(w, "Failed to get queue status", http.StatusInternalServerError)
        return
    }
    
    utils.SuccessResponse(w, status)
}