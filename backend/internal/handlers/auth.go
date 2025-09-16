package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"sync"
	"valorant-mobile-web/backend/internal/services"
	"valorant-mobile-web/backend/pkg/utils"
)

// In-memory user storage for development
var userStore = make(map[string]string) // email -> password
var userMutex sync.RWMutex

type AuthHandler struct {
	AuthService *services.AuthService
}

func NewAuthHandler() *AuthHandler {
	authService := services.NewAuthService("your-secret-key-here")
	return &AuthHandler{AuthService: authService}
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	// Log the request
	println("=== REGISTER REQUEST RECEIVED ===")
	println("Method:", r.Method)
	println("URL:", r.URL.String())
	println("Content-Type:", r.Header.Get("Content-Type"))

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		println("ERROR: Failed to decode request body:", err.Error())
		utils.ErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	println("Username:", req.Username)
	println("Email:", req.Email)
	println("Password length:", len(req.Password))

	if req.Username == "" || req.Email == "" || req.Password == "" {
		println("ERROR: Missing required fields")
		utils.ErrorResponse(w, "Username, email and password are required", http.StatusBadRequest)
		return
	}

	// Hash password (for development, we'll just verify it works)
	hashedPassword, err := h.AuthService.HashPassword(req.Password)
	if err != nil {
		println("ERROR: Failed to hash password:", err.Error())
		utils.ErrorResponse(w, "Failed to process password", http.StatusInternalServerError)
		return
	}

	// Store user in memory
	userMutex.Lock()
	userStore[req.Email] = hashedPassword
	userMutex.Unlock()

	println("SUCCESS: User registration successful and stored") // TODO: Save user to database
	// For now, just return success with mock user data
	response := map[string]interface{}{
		"success": true,
		"message": "User registered successfully",
		"user": map[string]interface{}{
			"id":       "mock-user-id",
			"username": req.Username,
			"email":    req.Email,
		},
	}

	println("Sending response:", response)
	utils.SuccessResponse(w, response)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	// Log the request
	println("=== LOGIN REQUEST RECEIVED ===")
	println("Method:", r.Method)
	println("URL:", r.URL.String())

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		println("ERROR: Failed to decode login request body:", err.Error())
		utils.ErrorResponse(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	println("Email:", req.Email)
	println("Password length:", len(req.Password))

	if req.Email == "" || req.Password == "" {
		println("ERROR: Missing email or password")
		utils.ErrorResponse(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	// Verify user credentials
	userMutex.RLock()
	storedHash, exists := userStore[req.Email]
	userMutex.RUnlock()

	if !exists {
		println("ERROR: User not found:", req.Email)
		utils.ErrorResponse(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Verify password
	if err := h.AuthService.VerifyPassword(storedHash, req.Password); err != nil {
		println("ERROR: Invalid password for:", req.Email)
		utils.ErrorResponse(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Generate token for authenticated user
	token, err := h.AuthService.GenerateToken("dummy-user-id")
	if err != nil {
		println("ERROR: Failed to generate token:", err.Error())
		utils.ErrorResponse(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	println("SUCCESS: Login successful for:", req.Email)

	response := map[string]interface{}{
		"success": true,
		"token":   token,
		"message": "Login successful",
		"user": map[string]interface{}{
			"id":       "mock-user-id",
			"email":    req.Email,
			"username": req.Email[:strings.Index(req.Email, "@")], // Extract username from email
		},
	}

	println("Sending login response")
	utils.SuccessResponse(w, response)
}
