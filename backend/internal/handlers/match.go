package handlers

import (
    "encoding/json"
    "net/http"
    "valorant-mobile-web/backend/internal/services"
    "valorant-mobile-web/backend/pkg/utils"
    
    "github.com/gorilla/mux"
)

type MatchHandler struct {
    matchmakingService *services.MatchmakingService
}

func NewMatchHandler() *MatchHandler {
    return &MatchHandler{
        matchmakingService: services.NewMatchmakingService(),
    }
}

func (mh *MatchHandler) StartMatch(w http.ResponseWriter, r *http.Request) {
    match, err := mh.matchmakingService.CreateMatch()
    if err != nil {
        utils.ErrorResponse(w, "Failed to start match: "+err.Error(), http.StatusBadRequest)
        return
    }
    
    utils.SuccessResponse(w, match)
}

type BanMapRequest struct {
    MatchID string `json:"match_id"`
    MapName string `json:"map_name"`
}

func (mh *MatchHandler) BanMap(w http.ResponseWriter, r *http.Request) {
    var req BanMapRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        utils.ErrorResponse(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    if req.MatchID == "" || req.MapName == "" {
        utils.ErrorResponse(w, "match_id and map_name are required", http.StatusBadRequest)
        return
    }
    
    err := mh.matchmakingService.BanMap(req.MatchID, req.MapName)
    if err != nil {
        utils.ErrorResponse(w, "Failed to ban map: "+err.Error(), http.StatusBadRequest)
        return
    }
    
    utils.MessageResponse(w, "Map banned successfully")
}

func (mh *MatchHandler) SelectMap(w http.ResponseWriter, r *http.Request) {
    vars := mux.Vars(r)
    matchID := vars["matchId"]
    
    if matchID == "" {
        utils.ErrorResponse(w, "match_id is required", http.StatusBadRequest)
        return
    }
    
    err := mh.matchmakingService.SelectRandomMap(matchID)
    if err != nil {
        utils.ErrorResponse(w, "Failed to select map: "+err.Error(), http.StatusBadRequest)
        return
    }
    
    utils.MessageResponse(w, "Map selected successfully")
}

type ReportResultRequest struct {
    MatchID string `json:"match_id"`
    Winner  string `json:"winner"` // "team1", "team2", "tie"
}

func (mh *MatchHandler) ReportResult(w http.ResponseWriter, r *http.Request) {
    userID := r.Header.Get("X-User-ID")
    if userID == "" {
        utils.ErrorResponse(w, "Unauthorized - User ID required", http.StatusUnauthorized)
        return
    }
    
    var req ReportResultRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        utils.ErrorResponse(w, "Invalid request body", http.StatusBadRequest)
        return
    }
    
    if req.MatchID == "" || req.Winner == "" {
        utils.ErrorResponse(w, "match_id and winner are required", http.StatusBadRequest)
        return
    }
    
    if req.Winner != "team1" && req.Winner != "team2" && req.Winner != "tie" {
        utils.ErrorResponse(w, "winner must be 'team1', 'team2', or 'tie'", http.StatusBadRequest)
        return
    }
    
    // TODO: Implementar lógica de votación
    utils.MessageResponse(w, "Vote recorded successfully")
}