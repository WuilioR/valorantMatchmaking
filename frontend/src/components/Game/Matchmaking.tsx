import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { QueueData, Match } from '../../types';

const Matchmaking: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isInQueue, setIsInQueue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [queueData, setQueueData] = useState<QueueData>({
    players_in_queue: 0,
    players: [],
    estimated_wait: '2-5 minutes',
    can_start_match: false
  });
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  // Fetch queue status
  const fetchQueueStatus = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/queue/status');
      const data = await response.json();
      if (data.success) {
        setQueueData(data.data);
        
        // Check if match can start
        if (data.data.can_start_match && isInQueue) {
          await createMatch();
        }
      }
    } catch (error) {
      console.error('Error fetching queue status:', error);
      setError('Failed to fetch queue status');
    }
  };

  // Join queue
  const joinQueue = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8080/api/queue/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id || 'temp-user-id'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsInQueue(true);
        fetchQueueStatus();
      } else {
        setError(data.message || 'Failed to join queue');
      }
    } catch (error) {
      console.error('Error joining queue:', error);
      setError('Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  // Leave queue
  const leaveQueue = async () => {
    if (!user) return;

    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/queue/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id || 'temp-user-id'
        }
      });
      
      if (response.ok) {
        setIsInQueue(false);
        fetchQueueStatus();
      }
    } catch (error) {
      console.error('Error leaving queue:', error);
      setError('Failed to leave queue');
    } finally {
      setLoading(false);
    }
  };

  // Create match when ready
  const createMatch = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/matchmaking/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user?.id || 'temp-user-id'
        },
        body: JSON.stringify({
          game_mode: 'competitive',
          map_pool: ['bind', 'haven', 'split', 'ascent', 'icebox']
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setCurrentMatch(data.data);
        setIsInQueue(false);
        // Navigate to game lobby after a short delay to show match found
        setTimeout(() => {
          navigate(`/game/${data.data.id}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating match:', error);
      setError('Failed to create match');
    }
  };

  // Real-time queue updates
  useEffect(() => {
    fetchQueueStatus();
    
    const interval = setInterval(() => {
      if (isInQueue) {
        fetchQueueStatus();
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isInQueue]);

  // Auto-create match when ready
  useEffect(() => {
    if (queueData.can_start_match && isInQueue) {
      createMatch();
    }
  }, [queueData.can_start_match, isInQueue]);

  // Show match found modal
  if (currentMatch) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="bg-valorant-dark-secondary border border-valorant-red rounded-lg p-8 text-center max-w-md">
          <div className="mb-6">
            <div className="text-green-400 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-valorant text-white mb-2">MATCH FOUND</h2>
            <p className="text-valorant-gray-300">Redirecting to game lobby...</p>
          </div>
          
          <div className="space-y-2 text-sm text-valorant-gray-400">
            <p>Match ID: {currentMatch.id}</p>
            <p>Game Mode: Competitive</p>
            <p>Players: 10/10</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-valorant text-white mb-4 text-glow">
          COMPETITIVE MATCHMAKING
        </h1>
        <p className="text-valorant-gray-300 text-lg">
          Find players of similar skill level for ranked matches
        </p>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-600 text-red-300 px-4 py-2 rounded mb-6">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Queue Controls */}
        <div className="bg-valorant-dark-secondary border border-valorant-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Queue Status</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-valorant-gray-300">Players in Queue:</span>
              <span className="text-white font-medium">{queueData.players_in_queue}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-valorant-gray-300">Estimated Wait:</span>
              <span className="text-white font-medium">{queueData.estimated_wait}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-valorant-gray-300">Your Status:</span>
              <span className={`font-medium ${isInQueue ? 'text-green-400' : 'text-gray-400'}`}>
                {isInQueue ? 'In Queue' : 'Not Queued'}
              </span>
            </div>
          </div>

          <div className="w-full bg-valorant-gray-800 rounded-full h-2 mb-4">
            <div 
              className="bg-valorant-red h-2 rounded-full transition-all duration-300"
              style={{ width: `${(queueData.players_in_queue / 10) * 100}%` }}
            />
          </div>

          {!isInQueue ? (
            <button
              onClick={joinQueue}
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Joining...' : 'JOIN QUEUE'}
            </button>
          ) : (
            <button
              onClick={leaveQueue}
              disabled={loading}
              className="btn-secondary w-full"
            >
              {loading ? 'Leaving...' : 'LEAVE QUEUE'}
            </button>
          )}
        </div>

        {/* Match Information */}
        <div className="bg-valorant-dark-secondary border border-valorant-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Match Information</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-valorant-gray-300 mb-2">Game Mode</h3>
              <p className="text-white">Competitive</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-valorant-gray-300 mb-2">Map Pool</h3>
              <div className="flex flex-wrap gap-2">
                {['Bind', 'Haven', 'Split', 'Ascent', 'Icebox'].map((map) => (
                  <span 
                    key={map}
                    className="px-2 py-1 bg-valorant-gray-800 text-valorant-gray-300 text-sm rounded"
                  >
                    {map}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-valorant-gray-300 mb-2">Match Format</h3>
              <p className="text-white">10 rounds to win</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-valorant-gray-300 mb-2">Team Size</h3>
              <p className="text-white">5v5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Queue Players */}
      {isInQueue && queueData.players && queueData.players.length > 0 && (
        <div className="mt-8 bg-valorant-dark-secondary border border-valorant-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Players in Queue</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {queueData.players.map((player, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-valorant-gray-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white font-medium">{player.username?.charAt(0) || 'P'}</span>
                </div>
                <p className="text-sm text-white">{player.username || `Player ${index + 1}`}</p>
                <p className="text-xs text-valorant-gray-400">ELO: {player.elo || 1000}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Matchmaking;
