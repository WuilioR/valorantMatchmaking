export interface User {
    id: string;
    username: string;
    email: string;
    elo: number;
}

export interface Player {
    id: string;
    username: string;
    elo?: number;
    ready?: boolean;
}

export type MatchStatus = 
  | 'pending'           // Esperando aceptaciones
  | 'ready'             // Todos aceptaron
  | 'cancelled'         // Alguien rechazó o expiró
  | 'created'           // Match room created, waiting for captain selection method
  | 'captain_selection' // Selecting captains (voting or random)
  | 'captain_voting'    // Players voting for captains
  | 'team_draft'        // Captains selecting teams
  | 'map_ban'           // Map banning phase
  | 'ongoing'           // Match in progress
  | 'reporting'         // Reporting results
  | 'completed'         // Match finished
  | 'disputed';         // Result disputed

export type CaptainSelectionMethod = 'voting' | 'random' | '';

export interface MatchPlayer {
  user_id: string;
  username: string;
  elo: number;
  accepted: boolean;
  team?: string;      // "A" or "B"
  role?: string;      // "captain" or "player"
}

export interface Match {
    id: string;
    status: MatchStatus;
    players: MatchPlayer[];
    team1: string[];
    team2: string[];
    captain1: string;
    captain2: string;
    captain_selection_method: CaptainSelectionMethod;
    captain_votes: { [key: string]: string };
    captain_candidates: string[];
    selected_map?: string;
    banned_maps?: string[];
    winner?: string;
    start_time: string;
    expire_time: string;
    created_at: string;
    updated_at: string;
}

export interface MatchRoom extends Match {
    // Alias for clarity in match room context
}

export interface QueueData {
    players_in_queue: number;
    players: Player[];
    estimated_wait: string;
    can_start_match: boolean;
    max_players?: number;
    is_queue_full?: boolean;
    should_create_match?: boolean;
}

export interface LeaderboardEntry {
    userId: string;
    username: string;
    elo: number;
    rank?: string;
    wins?: number;
    losses?: number;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}