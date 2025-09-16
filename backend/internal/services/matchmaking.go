package services

import (
	"fmt"
	"math/rand"
	"time"
	"valorant-mobile-web/backend/internal/database"
	"valorant-mobile-web/backend/internal/models"
)

type MatchmakingService struct {
	queueService *QueueService
}

func NewMatchmakingService() *MatchmakingService {
	return &MatchmakingService{
		queueService: NewQueueService(),
	}
}

func (ms *MatchmakingService) CreateMatch() (*models.Match, error) {
	// Obtener jugadores de la cola
	players, err := ms.queueService.GetQueuedPlayers(10)
	if err != nil {
		return nil, err
	}

	if len(players) < 10 {
		return nil, fmt.Errorf("not enough players in queue")
	}

	// Seleccionar capitanes (los 2 con mayor ELO)
	captain1 := players[0]
	captain2 := players[1]
	for _, player := range players {
		if player.ELO > captain1.ELO {
			captain2 = captain1
			captain1 = player
		} else if player.ELO > captain2.ELO {
			captain2 = player
		}
	}

	// Crear equipos balanceados
	team1, team2 := ms.balanceTeams(players)

	// Crear match en la base de datos
	query := `
        INSERT INTO matches (status, team1, team2, captain1, captain2, banned_maps)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, created_at, updated_at
    `

	var match models.Match
	err = database.DB.QueryRow(
		query,
		models.MatchStatusDraft,
		team1,
		team2,
		captain1.UserID,
		captain2.UserID,
		[]string{},
	).Scan(&match.ID, &match.CreatedAt, &match.UpdatedAt)

	if err != nil {
		return nil, err
	}

	match.Status = models.MatchStatusDraft
	match.Team1 = team1
	match.Team2 = team2
	match.Captain1 = captain1.UserID
	match.Captain2 = captain2.UserID
	match.BannedMaps = []string{}

	// Limpiar completamente la cola para que se pueda crear una nueva
	err = ms.queueService.ClearQueue()
	if err != nil {
		return nil, err
	}

	fmt.Printf("MATCH CREATED: %s - Queue cleared for new players\n", match.ID)

	return &match, nil
}

func (ms *MatchmakingService) balanceTeams(players []models.QueueEntry) ([]string, []string) {
	// Algoritmo simple de balanceado por ELO
	// Ordenar jugadores por ELO
	for i := 0; i < len(players)-1; i++ {
		for j := i + 1; j < len(players); j++ {
			if players[i].ELO < players[j].ELO {
				players[i], players[j] = players[j], players[i]
			}
		}
	}

	var team1, team2 []string
	team1ELO, team2ELO := 0, 0

	// Distribuir jugadores alternando para balancear ELO
	for i, player := range players[:10] {
		if i%2 == 0 || team1ELO < team2ELO {
			team1 = append(team1, player.UserID)
			team1ELO += player.ELO
		} else {
			team2 = append(team2, player.UserID)
			team2ELO += player.ELO
		}
	}

	return team1, team2
}

func (ms *MatchmakingService) BanMap(matchID, mapName string) error {
	// Verificar que el mapa existe
	validMap := false
	for _, m := range models.ValorantMaps {
		if m == mapName {
			validMap = true
			break
		}
	}

	if !validMap {
		return fmt.Errorf("invalid map name: %s", mapName)
	}

	// Añadir mapa a la lista de baneados
	query := `
        UPDATE matches 
        SET banned_maps = array_append(banned_maps, $1),
            updated_at = NOW()
        WHERE id = $2
    `

	_, err := database.DB.Exec(query, mapName, matchID)
	return err
}

func (ms *MatchmakingService) SelectRandomMap(matchID string) error {
	// Obtener mapas baneados
	var bannedMaps []string
	query := `SELECT banned_maps FROM matches WHERE id = $1`
	err := database.DB.QueryRow(query, matchID).Scan(&bannedMaps)
	if err != nil {
		return err
	}

	// Filtrar mapas disponibles
	var availableMaps []string
	for _, m := range models.ValorantMaps {
		banned := false
		for _, banned_map := range bannedMaps {
			if m == banned_map {
				banned = true
				break
			}
		}
		if !banned {
			availableMaps = append(availableMaps, m)
		}
	}

	if len(availableMaps) == 0 {
		return fmt.Errorf("no maps available")
	}

	// Seleccionar mapa aleatorio
	rand.Seed(time.Now().UnixNano())
	selectedMap := availableMaps[rand.Intn(len(availableMaps))]

	// Actualizar match
	updateQuery := `
        UPDATE matches 
        SET selected_map = $1, 
            status = $2,
            updated_at = NOW()
        WHERE id = $3
    `

	_, err = database.DB.Exec(updateQuery, selectedMap, models.MatchStatusOngoing, matchID)
	return err
}
