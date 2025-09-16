import * as api from './api';

export const login = async (email: string, password: string) => {
    try {
        const response = await api.login({ email, password });
        return { 
            user: response.data?.user || { id: 'temp-user', email, username: email.split('@')[0] }, 
            error: null 
        };
    } catch (error: any) {
        return { 
            user: null, 
            error: error.message || 'Login failed' 
        };
    }
};

export const register = async (username: string, email: string, password: string) => {
    try {
        const response = await api.register({ username, email, password });
        return { 
            user: response.data?.user || { id: 'temp-user', email, username }, 
            error: null 
        };
    } catch (error: any) {
        return { 
            user: null, 
            error: error.message || 'Registration failed' 
        };
    }
};

export const logout = async () => {
    try {
        // For now, just clear local storage
        localStorage.removeItem('user');
        return { error: null };
    } catch (error: any) {
        return { error: error.message || 'Logout failed' };
    }
};

export const getUser = () => {
    try {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    } catch {
        return null;
    }
};