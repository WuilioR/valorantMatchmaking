export const API_BASE_URL = 'http://localhost:8080/api';
export const AUTH_ENDPOINT = `${API_BASE_URL}/auth`;
export const MATCHMAKING_ENDPOINT = `${API_BASE_URL}/matchmaking`;
export const LEADERBOARD_ENDPOINT = `${API_BASE_URL}/leaderboard`;

export const ERROR_MESSAGES = {
    LOGIN_FAILED: 'Login failed. Please check your credentials.',
    REGISTER_FAILED: 'Registration failed. Please try again.',
    MATCHMAKING_ERROR: 'An error occurred while trying to find a match.',
    LEADERBOARD_FETCH_ERROR: 'Failed to fetch leaderboard data.',
};