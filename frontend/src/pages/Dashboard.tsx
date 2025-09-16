import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Leaderboard from '../components/Leaderboard/Leaderboard';
import Matchmaking from '../components/Game/Matchmaking';

const Dashboard: React.FC = () => {
    const { user } = useAuth();

    return (
        <div className="flex flex-col items-center p-4">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            {user ? (
                <div className="w-full max-w-md">
                    <h2 className="text-xl font-semibold mb-2">Welcome, {user.username}!</h2>
                    <Matchmaking />
                    <Leaderboard />
                </div>
            ) : (
                <p className="text-red-500">Please log in to view your dashboard.</p>
            )}
        </div>
    );
};

export default Dashboard;