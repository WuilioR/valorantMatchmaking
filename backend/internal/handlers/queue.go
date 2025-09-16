package handlers

import (
	"fmt"
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
	fmt.Printf("=== JOIN QUEUE REQUEST ===\n")
	fmt.Printf("Method: %s\n", r.Method)
	fmt.Printf("URL: %s\n", r.URL.String())
	fmt.Printf("Headers: %v\n", r.Header)

	userID := r.Header.Get("X-User-ID")
	fmt.Printf("Received userID: '%s'\n", userID)

	if userID == "" {
		// For development, use a mock user ID
		userID = "mock-user-id"
		fmt.Printf("Using fallback userID: %s\n", userID)
	}

	fmt.Printf("Final userID: %s\n", userID)

	err := qh.queueService.JoinQueue(userID)
	if err != nil {
		fmt.Printf("ERROR joining queue: %v\n", err)
		utils.ErrorResponse(w, "Failed to join queue", http.StatusInternalServerError)
		return
	}

	fmt.Printf("SUCCESS: User %s joined queue\n", userID)

	response := map[string]interface{}{
		"success": true,
		"message": "Successfully joined queue",
		"userID":  userID,
	}

	utils.SuccessResponse(w, response)
}

func (qh *QueueHandler) LeaveQueue(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" {
		userID = "mock-user-id"
	}

	fmt.Printf("LEAVE QUEUE REQUEST: userID=%s\n", userID)

	err := qh.queueService.LeaveQueue(userID)
	if err != nil {
		fmt.Printf("ERROR leaving queue: %v\n", err)
		utils.ErrorResponse(w, "Failed to leave queue", http.StatusInternalServerError)
		return
	}

	fmt.Printf("SUCCESS: User %s left queue\n", userID)
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
