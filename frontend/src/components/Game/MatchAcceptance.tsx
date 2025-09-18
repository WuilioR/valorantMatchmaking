import React, { useState, useEffect } from 'react';
import { Match } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface MatchAcceptanceProps {
  match: Match;
  onAccept: () => void;
  onDecline: () => void;
}

const MatchAcceptance: React.FC<MatchAcceptanceProps> = ({ match, onAccept, onDecline }) => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  // Calculate time left
  useEffect(() => {
    const calculateTimeLeft = () => {
      const expireTime = new Date(match.expire_time).getTime();
      const now = new Date().getTime();
      const difference = expireTime - now;
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft <= 0) {
        clearInterval(timer);
        // Auto decline if time runs out
        handleDecline();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [match.expire_time]);

  const handleAccept = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const userID = localStorage.getItem('session-user-id') || user?.email || '';
      
      const response = await fetch(`http://localhost:8080/api/match/${match.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userID,
        },
        body: JSON.stringify({
          user_id: userID
        })
      });

      if (response.ok) {
        console.log('Match accepted successfully');
        onAccept();
      } else {
        const error = await response.text();
        console.error('Failed to accept match:', error);
        alert('Failed to accept match: ' + error);
      }
    } catch (error) {
      console.error('Error accepting match:', error);
      alert('Error accepting match');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const userID = localStorage.getItem('session-user-id') || user?.email || '';
      
      const response = await fetch(`http://localhost:8080/api/match/${match.id}/decline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userID,
        },
        body: JSON.stringify({
          user_id: userID
        })
      });

      if (response.ok) {
        console.log('Match declined successfully');
        onDecline();
      } else {
        const error = await response.text();
        console.error('Failed to decline match:', error);
      }
    } catch (error) {
      console.error('Error declining match:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user has already accepted
  const userID = localStorage.getItem('session-user-id') || user?.email || '';
  const currentPlayer = match.players.find(p => p.user_id === userID);
  const hasAccepted = currentPlayer?.accepted || false;

  // Count accepted players
  const acceptedCount = match.players.filter(p => p.accepted).length;
  const totalPlayers = match.players.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-valorant-dark-secondary border-2 border-valorant-red rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            🎮 Match Found!
          </h2>
          
          <div className="mb-6">
            <div className="text-valorant-gold text-lg mb-2">
              {acceptedCount}/{totalPlayers} players ready
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div 
                className="bg-valorant-gold h-2 rounded-full transition-all duration-300"
                style={{ width: `${(acceptedCount / totalPlayers) * 100}%` }}
              />
            </div>

            <div className="text-white text-3xl font-bold mb-2">
              {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
              {String(timeLeft % 60).padStart(2, '0')}
            </div>
            <div className="text-gray-400 text-sm">
              Time to accept
            </div>
          </div>

          {!hasAccepted ? (
            <div className="flex gap-4">
              <button
                onClick={handleDecline}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded transition-colors"
              >
                {loading ? 'Processing...' : 'Decline'}
              </button>
              
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 bg-valorant-gold hover:bg-yellow-500 disabled:opacity-50 text-black font-bold py-3 px-6 rounded transition-colors"
              >
                {loading ? 'Processing...' : 'Accept'}
              </button>
            </div>
          ) : (
            <div className="text-valorant-gold font-bold text-lg">
              ✅ You have accepted! Waiting for other players...
            </div>
          )}

          <div className="mt-4 text-gray-400 text-sm">
            Average ELO: {Math.round(match.players.reduce((sum, p) => sum + p.elo, 0) / match.players.length)}
          </div>
          
          {/* Show players list */}
          <div className="mt-4 text-left">
            <h3 className="text-sm font-bold text-gray-400 mb-2">Players:</h3>
            <div className="max-h-32 overflow-y-auto">
              {match.players.map((player, index) => (
                <div key={player.user_id} className="flex justify-between items-center text-xs py-1">
                  <span className="text-white">{player.username}</span>
                  <span className={`ml-2 ${player.accepted ? 'text-green-400' : 'text-gray-400'}`}>
                    {player.accepted ? '✅' : '⏳'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchAcceptance;