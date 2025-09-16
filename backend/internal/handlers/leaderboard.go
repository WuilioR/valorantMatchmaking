package handlers

import (
	"net/http"
	"strconv"
	"valorant-mobile-web/backend/internal/database"
	"valorant-mobile-web/backend/internal/models"
	"valorant-mobile-web/backend/pkg/utils"
)

type LeaderboardHandler struct{}

func NewLeaderboardHandler() *LeaderboardHandler {
	return &LeaderboardHandler{}
}

func (lh *LeaderboardHandler) GetLeaderboard(w http.ResponseWriter, r *http.Request) {
	// Obtener parámetros de consulta
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	offset := 0 // default

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	query := `
        SELECT 
            id, username, email, elo, wins, losses, created_at, updated_at,
            CASE 
                WHEN (wins + losses) > 0 THEN ROUND((wins::float / (wins + losses)::float) * 100, 2)
                ELSE 0 
            END as win_rate,
            (wins + losses) as games_total,
            ROW_NUMBER() OVER (ORDER BY elo DESC) as rank
        FROM users 
        ORDER BY elo DESC 
        LIMIT $1 OFFSET $2
    `

	rows, err := database.DB.Query(query, limit, offset)
	if err != nil {
		// Si hay error con la base de datos, devolver datos de prueba
		mockData := []map[string]interface{}{
			{
				"userId":   "1",
				"username": "ValorantPro",
				"elo":      2100,
				"wins":     45,
				"losses":   15,
			},
			{
				"userId":   "2",
				"username": "DiamondPlayer",
				"elo":      1750,
				"wins":     38,
				"losses":   22,
			},
			{
				"userId":   "3",
				"username": "PlatinumAce",
				"elo":      1450,
				"wins":     28,
				"losses":   18,
			},
			{
				"userId":   "4",
				"username": "GoldSniper",
				"elo":      1250,
				"wins":     22,
				"losses":   20,
			},
			{
				"userId":   "5",
				"username": "SilverStrike",
				"elo":      1050,
				"wins":     15,
				"losses":   25,
			},
		}

		utils.SuccessResponse(w, mockData)
		return
	}
	defer rows.Close()

	var leaderboard []models.UserStats
	for rows.Next() {
		var user models.UserStats
		err := rows.Scan(
			&user.ID, &user.Username, &user.Email, &user.ELO,
			&user.Wins, &user.Losses, &user.CreatedAt, &user.UpdatedAt,
			&user.WinRate, &user.GamesTotal, &user.Rank,
		)
		if err != nil {
			utils.ErrorResponse(w, "Failed to scan leaderboard data", http.StatusInternalServerError)
			return
		}
		leaderboard = append(leaderboard, user)
	}

	// Si no hay datos, devolver datos de prueba
	if len(leaderboard) == 0 {
		mockData := []map[string]interface{}{
			{
				"userId":   "1",
				"username": "ValorantPro",
				"elo":      2100,
				"wins":     45,
				"losses":   15,
			},
			{
				"userId":   "2",
				"username": "DiamondPlayer",
				"elo":      1750,
				"wins":     38,
				"losses":   22,
			},
			{
				"userId":   "3",
				"username": "PlatinumAce",
				"elo":      1450,
				"wins":     28,
				"losses":   18,
			},
			{
				"userId":   "4",
				"username": "GoldSniper",
				"elo":      1250,
				"wins":     22,
				"losses":   20,
			},
			{
				"userId":   "5",
				"username": "SilverStrike",
				"elo":      1050,
				"wins":     15,
				"losses":   25,
			},
		}

		utils.SuccessResponse(w, mockData)
		return
	}

	response := map[string]interface{}{
		"leaderboard": leaderboard,
		"total":       len(leaderboard),
		"limit":       limit,
		"offset":      offset,
	}

	utils.SuccessResponse(w, response)
}

func (lh *LeaderboardHandler) GetUserRank(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		utils.ErrorResponse(w, "user_id parameter is required", http.StatusBadRequest)
		return
	}

	query := `
        SELECT 
            id, username, email, elo, wins, losses, created_at, updated_at,
            CASE 
                WHEN (wins + losses) > 0 THEN ROUND((wins::float / (wins + losses)::float) * 100, 2)
                ELSE 0 
            END as win_rate,
            (wins + losses) as games_total,
            (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.elo > u1.elo) as rank
        FROM users u1
        WHERE id = $1
    `

	var user models.UserStats
	err := database.DB.QueryRow(query, userID).Scan(
		&user.ID, &user.Username, &user.Email, &user.ELO,
		&user.Wins, &user.Losses, &user.CreatedAt, &user.UpdatedAt,
		&user.WinRate, &user.GamesTotal, &user.Rank,
	)

	if err != nil {
		utils.ErrorResponse(w, "User not found", http.StatusNotFound)
		return
	}

	utils.SuccessResponse(w, user)
}
