package services

import (
    "math"
)

type ELOService struct{}

func NewELOService() *ELOService {
    return &ELOService{}
}

// Calcula nuevo ELO basado en resultado y ELO del oponente
func (es *ELOService) CalculateNewELO(playerELO, opponentAvgELO int, won bool) int {
    k := 32.0 // Factor K para ELO
    
    // Probabilidad esperada de ganar
    expectedScore := 1.0 / (1.0 + math.Pow(10, float64(opponentAvgELO-playerELO)/400.0))
    
    // Puntuación real (1 si ganó, 0 si perdió)
    actualScore := 0.0
    if won {
        actualScore = 1.0
    }
    
    // Calcular nuevo ELO
    newELO := float64(playerELO) + k*(actualScore-expectedScore)
    
    // Asegurar que no baje de 100 ni suba más de 3000
    if newELO < 100 {
        newELO = 100
    }
    if newELO > 3000 {
        newELO = 3000
    }
    
    return int(math.Round(newELO))
}

func (es *ELOService) CalculateTeamAverageELO(playerELOs []int) int {
    if len(playerELOs) == 0 {
        return 1000
    }
    
    sum := 0
    for _, elo := range playerELOs {
        sum += elo
    }
    
    return sum / len(playerELOs)
}

// Calcula cambios de ELO para todos los jugadores de ambos equipos
func (es *ELOService) CalculateELOChanges(team1ELOs, team2ELOs []int, team1Won bool) ([]int, []int) {
    team1AvgELO := es.CalculateTeamAverageELO(team1ELOs)
    team2AvgELO := es.CalculateTeamAverageELO(team2ELOs)
    
    var newTeam1ELOs []int
    var newTeam2ELOs []int
    
    // Calcular nuevos ELOs para equipo 1
    for _, elo := range team1ELOs {
        newELO := es.CalculateNewELO(elo, team2AvgELO, team1Won)
        newTeam1ELOs = append(newTeam1ELOs, newELO)
    }
    
    // Calcular nuevos ELOs para equipo 2
    for _, elo := range team2ELOs {
        newELO := es.CalculateNewELO(elo, team1AvgELO, !team1Won)
        newTeam2ELOs = append(newTeam2ELOs, newELO)
    }
    
    return newTeam1ELOs, newTeam2ELOs
}