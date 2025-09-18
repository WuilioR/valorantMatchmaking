import React, { useState, useEffect } from 'react';
import { Match } from '../../types';

interface MatchFoundProps {
  match: Match;
}

const MatchFound: React.FC<MatchFoundProps> = ({ match }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !accepted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, accepted]);

  const handleAcceptMatch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/match/${match.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': 'temp-user-id' // TODO: Get from auth context
        }
      });
      
      if (response.ok) {
        setAccepted(true);
      }
    } catch (error) {
      console.error('Error accepting match:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineMatch = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/match/${match.id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': 'temp-user-id' // TODO: Get from auth context
        }
      });
      
      if (response.ok) {
        // Handle decline - probably redirect back to queue
        window.location.reload(); // Simple solution for now
      }
    } catch (error) {
      console.error('Error declining match:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-valorant-dark-800 border-2 border-valorant-red rounded-xl p-8 max-w-md w-full mx-4 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-valorant text-valorant-red mb-2 text-glow">
            MATCH FOUND
          </h2>
          <div className="text-6xl font-bold text-white mb-2">
            {timeLeft}
          </div>
          <p className="text-valorant-gray-300">
            {accepted ? 'Waiting for other players...' : 'Accept the match to continue'}
          </p>
        </div>

        {/* Progress Ring */}
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#FF4655"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${(timeLeft / 30) * 283} 283`}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {accepted ? (
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 bg-valorant-red rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="bg-valorant-gray-800 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-valorant-gray-400">Mode:</span>
              <div className="text-white font-medium">Competitive</div>
            </div>
            <div>
              <span className="text-valorant-gray-400">Players:</span>
              <div className="text-white font-medium">10/10</div>
            </div>
            <div>
              <span className="text-valorant-gray-400">Average ELO:</span>
              <div className="text-white font-medium">
                {match.players?.length > 0 
                  ? Math.round(match.players.reduce((sum, p) => sum + (p.elo || 1200), 0) / match.players.length)
                  : '1400'}
              </div>
            </div>
            <div>
              <span className="text-valorant-gray-400">Server:</span>
              <div className="text-white font-medium">US-East</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!accepted ? (
          <div className="flex space-x-4">
            <button
              onClick={handleDeclineMatch}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              {loading ? 'Declining...' : 'DECLINE'}
            </button>
            <button
              onClick={handleAcceptMatch}
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Accepting...
                </div>
              ) : (
                'ACCEPT'
              )}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center bg-green-600 text-green-100 px-6 py-3 rounded-lg">
              <div className="w-3 h-3 bg-green-300 rounded-full mr-2 animate-pulse"></div>
              MATCH ACCEPTED
            </div>
            <p className="text-valorant-gray-400 text-sm mt-3">
              Waiting for other players to accept...
            </p>
          </div>
        )}

        {/* Warning */}
        <div className="mt-4 text-center">
          <p className="text-valorant-gray-500 text-xs">
            Failing to accept will result in a matchmaking penalty
          </p>
        </div>
      </div>
    </div>
  );
};

export default MatchFound;