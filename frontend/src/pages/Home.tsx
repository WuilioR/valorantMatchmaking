import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
                <h1 className="text-5xl font-valorant text-white mb-4 text-glow">
                    Welcome to Valorant Mobile
                </h1>
                <p className="text-xl text-valorant-gray-300 mb-8">
                    Competitive matchmaking platform for mobile Valorant
                </p>
                <div className="space-x-4">
                    <Link to="/matchmaking" className="btn-primary">
                        Start Matchmaking
                    </Link>
                    <Link to="/leaderboard" className="btn-secondary">
                        View Leaderboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;