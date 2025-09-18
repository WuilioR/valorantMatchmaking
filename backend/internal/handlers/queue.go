package handlers

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"time"
	"valorant-mobile-web/backend/internal/services"
	"valorant-mobile-web/backend/pkg/utils"
)

type QueueHandler struct {
	queueService *services.QueueService
}

type JoinQueueRequest struct {
	Username string `json:"username"`
	ELO      int    `json:"elo"`
}

// Remove default constructor to enforce singleton usage
// func NewQueueHandler() *QueueHandler {
//     return &QueueHandler{
//         queueService: services.NewQueueService(),
//     }
// }

// NewQueueHandlerWithService creates a QueueHandler with a shared service instance
func NewQueueHandlerWithService(queueService *services.QueueService) *QueueHandler {
	return &QueueHandler{
		queueService: queueService,
	}
}

// generateUserID generates a unique user ID for development purposes
func generateUserID() string {
	return fmt.Sprintf("user-%d-%d", time.Now().Unix(), rand.Intn(10000))
}

func (qh *QueueHandler) JoinQueue(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("=== JOIN QUEUE REQUEST ===\n")
	fmt.Printf("Method: %s\n", r.Method)
	fmt.Printf("URL: %s\n", r.URL.String())
	fmt.Printf("Headers: %v\n", r.Header)

	userID := r.Header.Get("X-User-ID")
	username := r.Header.Get("X-Username")
	eloStr := r.Header.Get("X-User-ELO")

	fmt.Printf("Received userID: '%s'\n", userID)
	fmt.Printf("Received username: '%s'\n", username)
	fmt.Printf("Received ELO: '%s'\n", eloStr)

	if userID == "" || userID == "temp-user-id" {
		// Generate a unique user ID for development
		userID = generateUserID()
		fmt.Printf("Generated new userID: %s\n", userID)
	}

	// Parse request body for additional user data
	var reqBody JoinQueueRequest
	if r.Body != nil {
		if err := json.NewDecoder(r.Body).Decode(&reqBody); err == nil {
			if reqBody.Username != "" {
				username = reqBody.Username
			}
			if reqBody.ELO > 0 {
				eloStr = strconv.Itoa(reqBody.ELO)
			}
		}
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

	fmt.Printf("Final userID: %s, username: %s, ELO: %d\n", userID, username, elo)

	err := qh.queueService.JoinQueue(userID, username, elo)
	if err != nil {
		fmt.Printf("ERROR joining queue: %v\n", err)
		utils.ErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("SUCCESS: User %s (%s) joined queue\n", username, userID)

	response := map[string]interface{}{
		"success":  true,
		"message":  "Successfully joined queue",
		"userID":   userID,
		"username": username,
		"elo":      elo,
	}

	utils.SuccessResponse(w, response)
}

func (qh *QueueHandler) LeaveQueue(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("X-User-ID")
	if userID == "" || userID == "temp-user-id" {
		utils.ErrorResponse(w, "User ID is required to leave queue", http.StatusBadRequest)
		return
	}

	fmt.Printf("LEAVE QUEUE REQUEST: userID=%s\n", userID)

	err := qh.queueService.LeaveQueue(userID)
	if err != nil {
		fmt.Printf("ERROR leaving queue: %v\n", err)
		utils.ErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	fmt.Printf("SUCCESS: User %s left queue\n", userID)

	response := map[string]interface{}{
		"success": true,
		"message": "Successfully left queue",
		"userID":  userID,
	}

	utils.SuccessResponse(w, response)
}

func (qh *QueueHandler) GetQueueStatus(w http.ResponseWriter, r *http.Request) {
	status, err := qh.queueService.GetQueueStatus()
	if err != nil {
		utils.ErrorResponse(w, "Failed to get queue status", http.StatusInternalServerError)
		return
	}

	utils.SuccessResponse(w, status)
}
