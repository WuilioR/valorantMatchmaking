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

export interface Match {
    id: string;
    playerIds: string[];
    status: 'waiting' | 'in_progress' | 'completed';
    winnerId?: string;
    avg_elo?: number;
    team1?: Player[];
    team2?: Player[];
    captain1?: string;
    captain2?: string;
    maps?: string[];
    current_map?: string;
    created_at?: string;
}

export interface QueueData {
    players_in_queue: number;
    players: Player[];
    estimated_wait: string;
    can_start_match: boolean;
    max_players?: number;
    is_queue_full?: boolean;
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