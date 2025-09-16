package api

import (
	"net/http"
	"valorant-mobile-web/backend/internal/handlers"

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
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID, Accept, Origin, X-Requested-With")
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

	// Initialize handlers
	queueHandler := handlers.NewQueueHandler()
	matchHandler := handlers.NewMatchHandler()
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
	api.HandleFunc("/queue/join", queueHandler.JoinQueue).Methods("POST")
	api.HandleFunc("/queue/leave", queueHandler.LeaveQueue).Methods("DELETE")
	api.HandleFunc("/queue/status", queueHandler.GetQueueStatus).Methods("GET")

	// Match endpoints
	api.HandleFunc("/match/start", matchHandler.StartMatch).Methods("POST")
	api.HandleFunc("/match/ban", matchHandler.BanMap).Methods("POST")
	api.HandleFunc("/match/{matchId}/select-map", matchHandler.SelectMap).Methods("POST")
	api.HandleFunc("/match/report", matchHandler.ReportResult).Methods("POST")

	// Leaderboard endpoints
	api.HandleFunc("/leaderboard", leaderboardHandler.GetLeaderboard).Methods("GET")
	api.HandleFunc("/leaderboard/user", leaderboardHandler.GetUserRank).Methods("GET")

	return router
}
