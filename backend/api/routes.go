package api

import (
	"net/http"
	"valorant-mobile-web/backend/internal/handlers"
	"valorant-mobile-web/backend/internal/services"

	"github.com/gorilla/mux"
)

func SetupRoutes() *mux.Router {
	router := mux.NewRouter()

	// CORS middleware mejorado - aplicado globalmente
	router.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Configurar headers CORS
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID, X-Username, X-User-ELO, Accept, Origin, X-Requested-With")
			w.Header().Set("Access-Control-Max-Age", "3600")

			// Log para debug
			println("CORS: Request Method:", r.Method, "URL:", r.URL.Path)

			// Manejar preflight requests
			if r.Method == "OPTIONS" {
				println("CORS: Handling OPTIONS preflight request")
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	})

	// Initialize shared services (SINGLETONS)
	queueService := services.NewQueueService()
	matchRoomService := services.NewMatchRoomServiceWithQueue(queueService)
	matchAcceptanceService := services.NewMatchAcceptanceService()

	// Initialize handlers with shared services
	queueHandler := handlers.NewQueueHandlerWithService(queueService)
	matchRoomHandler := handlers.NewMatchRoomHandlerWithServices(matchRoomService, queueService)
	matchAcceptanceHandler := handlers.NewMatchAcceptanceHandlerWithService(matchAcceptanceService)
	leaderboardHandler := handlers.NewLeaderboardHandler()
	authHandler := handlers.NewAuthHandler()

	// Health check endpoint
	router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "ok", "message": "Valorant Backend API is running"}`))
	}).Methods("GET")

	// API routes
	api := router.PathPrefix("/api").Subrouter()

	// Auth endpoints
	api.HandleFunc("/auth/register", authHandler.Register).Methods("POST", "OPTIONS")
	api.HandleFunc("/auth/login", authHandler.Login).Methods("POST", "OPTIONS")

	// Queue endpoints
	api.HandleFunc("/queue/join", queueHandler.JoinQueue).Methods("POST", "OPTIONS")
	api.HandleFunc("/queue/leave", queueHandler.LeaveQueue).Methods("POST", "OPTIONS")
	api.HandleFunc("/queue/status", queueHandler.GetQueueStatus).Methods("GET", "OPTIONS")

	// Match room endpoints
	api.HandleFunc("/match-room/create", matchRoomHandler.CreateMatchRoom).Methods("POST", "OPTIONS")
	api.HandleFunc("/match-room/debug", matchRoomHandler.DebugMatchRoom).Methods("GET", "OPTIONS")
	api.HandleFunc("/match-room/{matchId}", matchRoomHandler.GetMatchRoom).Methods("GET", "OPTIONS")
	api.HandleFunc("/match-room/player", matchRoomHandler.GetPlayerMatchRoom).Methods("GET", "OPTIONS")
	api.HandleFunc("/match-room/{matchId}/captain-selection", matchRoomHandler.SetCaptainSelectionMethod).Methods("POST", "OPTIONS")
	api.HandleFunc("/match-room/{matchId}/vote-captain", matchRoomHandler.VoteForCaptain).Methods("POST", "OPTIONS")

	// Match acceptance endpoints
	api.HandleFunc("/match/{id}/accept", matchAcceptanceHandler.AcceptMatch).Methods("POST", "OPTIONS")
	api.HandleFunc("/match/{id}/decline", matchAcceptanceHandler.DeclineMatch).Methods("POST", "OPTIONS")

	// Leaderboard endpoints
	api.HandleFunc("/leaderboard", leaderboardHandler.GetLeaderboard).Methods("GET", "OPTIONS")

	return router
}
