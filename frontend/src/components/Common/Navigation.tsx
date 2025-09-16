import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navigation: React.FC = () => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = '/'; // Redirect to home after logout
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <nav className="bg-valorant-dark border-b border-valorant-red/20">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to="/" className="text-xl font-valorant text-white hover:text-valorant-red transition-colors">
                            VALORANT MOBILE
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex space-x-8">
                        <Link 
                            to="/" 
                            className={`text-sm font-medium transition-colors px-3 py-2 rounded ${
                                isActive('/') 
                                    ? 'text-valorant-red bg-valorant-red/10' 
                                    : 'text-valorant-gray-300 hover:text-white hover:bg-valorant-gray-800'
                            }`}
                        >
                            HOME
                        </Link>
                        <Link 
                            to="/dashboard" 
                            className={`text-sm font-medium transition-colors px-3 py-2 rounded ${
                                isActive('/dashboard') 
                                    ? 'text-valorant-red bg-valorant-red/10' 
                                    : 'text-valorant-gray-300 hover:text-white hover:bg-valorant-gray-800'
                            }`}
                        >
                            DASHBOARD
                        </Link>
                        <Link 
                            to="/leaderboard" 
                            className={`text-sm font-medium transition-colors px-3 py-2 rounded ${
                                isActive('/leaderboard') 
                                    ? 'text-valorant-red bg-valorant-red/10' 
                                    : 'text-valorant-gray-300 hover:text-white hover:bg-valorant-gray-800'
                            }`}
                        >
                            LEADERBOARD
                        </Link>
                        <Link 
                            to="/profile" 
                            className={`text-sm font-medium transition-colors px-3 py-2 rounded ${
                                isActive('/profile') 
                                    ? 'text-valorant-red bg-valorant-red/10' 
                                    : 'text-valorant-gray-300 hover:text-white hover:bg-valorant-gray-800'
                            }`}
                        >
                            PROFILE
                        </Link>
                        
                        {/* Auth Links - Conditional based on user state */}
                        <div className="flex space-x-4 ml-8">
                            {user ? (
                                // User is logged in
                                <>
                                    <span className="text-sm font-medium text-valorant-gray-300 px-4 py-2">
                                        Welcome, {user.username || user.email}
                                    </span>
                                    <button 
                                        onClick={handleLogout}
                                        className="text-sm font-medium text-valorant-gray-300 hover:text-white transition-colors px-4 py-2 border border-valorant-gray-600 rounded hover:border-valorant-red"
                                    >
                                        LOGOUT
                                    </button>
                                </>
                            ) : (
                                // User is not logged in
                                <>
                                    <Link 
                                        to="/login" 
                                        className="text-sm font-medium text-valorant-gray-300 hover:text-white transition-colors px-4 py-2 border border-valorant-gray-600 rounded hover:border-valorant-red"
                                    >
                                        LOGIN
                                    </Link>
                                    <Link 
                                        to="/register" 
                                        className="text-sm font-medium bg-valorant-red text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                                    >
                                        REGISTER
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;