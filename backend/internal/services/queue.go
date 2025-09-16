package services

import (
    "valorant-mobile-web/backend/internal/database"
    "valorant-mobile-web/backend/internal/models"
)

type QueueService struct{}

func NewQueueService() *QueueService {
    return &QueueService{}
}

func (qs *QueueService) JoinQueue(userID string) error {
    query := `INSERT INTO queue (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`
    _, err := database.DB.Exec(query, userID)
    return err
}

func (qs *QueueService) LeaveQueue(userID string) error {
    query := `DELETE FROM queue WHERE user_id = $1`
    _, err := database.DB.Exec(query, userID)
    return err
}

func (qs *QueueService) GetQueueStatus() (*models.QueueStatus, error) {
    query := `
        SELECT q.user_id, u.username, u.elo, q.joined_at
        FROM queue q
        JOIN users u ON q.user_id = u.id
        ORDER BY q.joined_at ASC
    `
    
    rows, err := database.DB.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var players []models.QueueEntry
    for rows.Next() {
        var player models.QueueEntry
        err := rows.Scan(&player.UserID, &player.Username, &player.ELO, &player.JoinedAt)
        if err != nil {
            return nil, err
        }
        players = append(players, player)
    }
    
    canStart := len(players) >= 10
    estimatedWait := "2-5 minutes"
    if len(players) >= 8 {
        estimatedWait = "30 seconds - 2 minutes"
    } else if len(players) >= 5 {
        estimatedWait = "1-3 minutes"
    }
    
    return &models.QueueStatus{
        PlayersInQueue: len(players),
        Players:        players,
        EstimatedWait:  estimatedWait,
        CanStartMatch:  canStart,
    }, nil
}

func (qs *QueueService) CanStartMatch() bool {
    var count int
    query := `SELECT COUNT(*) FROM queue`
    database.DB.QueryRow(query).Scan(&count)
    return count >= 10
}

func (qs *QueueService) GetQueuedPlayers(limit int) ([]models.QueueEntry, error) {
    query := `
        SELECT q.user_id, u.username, u.elo, q.joined_at
        FROM queue q
        JOIN users u ON q.user_id = u.id
        ORDER BY q.joined_at ASC
        LIMIT $1
    `
    
    rows, err := database.DB.Query(query, limit)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var players []models.QueueEntry
    for rows.Next() {
        var player models.QueueEntry
        err := rows.Scan(&player.UserID, &player.Username, &player.ELO, &player.JoinedAt)
        if err != nil {
            return nil, err
        }
        players = append(players, player)
    }
    
    return players, nil
}

func (qs *QueueService) RemovePlayersFromQueue(userIDs []string) error {
    if len(userIDs) == 0 {
        return nil
    }
    
    query := `DELETE FROM queue WHERE user_id = ANY($1)`
    _, err := database.DB.Exec(query, userIDs)
    return err
}