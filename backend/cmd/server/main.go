package main

import (
	"log"
	"net/http"
	"valorant-mobile-web/backend/api"
	"valorant-mobile-web/backend/internal/database"
)

func main() {
	// Initialize database connection
	err := database.Connect()
	if err != nil {
		log.Fatalf("Could not connect to the database: %v", err)
	}

	// Set up routes
	router := api.SetupRoutes()

	// Start the HTTP server
	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", router); err != nil {
		log.Fatalf("Could not start server: %v", err)
	}
}
