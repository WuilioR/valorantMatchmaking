import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api'; // Adjust the base URL as needed

export const login = async (credentials: { email: string; password: string }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const register = async (userData: { username: string; email: string; password: string }) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const fetchLeaderboard = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/leaderboard`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const createMatch = async (matchData: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/matchmaking`, matchData);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const getMatchDetails = async (matchId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/matchmaking/${matchId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const getUserProfile = async (userId: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${userId}`);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};

export const updateUserProfile = async (userId: string, profileData: { username?: string; email?: string }) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/${userId}`, profileData);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || error.message;
    }
};