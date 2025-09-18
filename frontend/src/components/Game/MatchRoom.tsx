import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MatchRoom, MatchPlayer } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const MatchRoomComponent: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [matchRoom, setMatchRoom] = useState<MatchRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedCaptainMethod, setSelectedCaptainMethod] = useState<'voting' | 'random' | ''>('');
  const [votedCandidate, setVotedCandidate] = useState<string>('');

  // Fetch match room data
  const fetchMatchRoom = async () => {
    if (!matchId) return;
    
    try {
      const userID = localStorage.getItem('session-user-id');
      const response = await fetch(`http://localhost:8080/api/match-room/${matchId}`, {
        headers: {
          'X-User-ID': userID || '',
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        setMatchRoom(data);
      } else {
        setError(data.message || 'Failed to fetch match room');
      }
    } catch (error) {
      console.error('Error fetching match room:', error);
      setError('Failed to fetch match room');
    } finally {
      setLoading(false);
    }
  };

  // Set captain selection method
  const setCaptainSelectionMethod = async (method: 'voting' | 'random') => {
    if (!matchId) return;
    
    try {
      const userID = localStorage.getItem('session-user-id');
      const response = await fetch(`http://localhost:8080/api/match-room/${matchId}/captain-selection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userID || '',
        },
        body: JSON.stringify({ method })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMatchRoom(data.match);
        setSelectedCaptainMethod(method);
      } else {
        setError(data.message || 'Failed to set captain selection method');
      }
    } catch (error) {
      console.error('Error setting captain selection method:', error);
      setError('Failed to set captain selection method');
    }
  };

  // Vote for captain
  const voteForCaptain = async (candidateId: string) => {
    if (!matchId) return;
    
    try {
      const userID = localStorage.getItem('session-user-id');
      const response = await fetch(`http://localhost:8080/api/match-room/${matchId}/vote-captain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userID || '',
        },
        body: JSON.stringify({ candidate_id: candidateId })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMatchRoom(data.match);
        setVotedCandidate(candidateId);
      } else {
        setError(data.message || 'Failed to vote for captain');
      }
    } catch (error) {
      console.error('Error voting for captain:', error);
      setError('Failed to vote for captain');
    }
  };

  // Get player name by ID
  const getPlayerName = (playerId: string): string => {
    const player = matchRoom?.players.find(p => p.user_id === playerId);
    return player?.username || `Player ${playerId.slice(-4)}`;
  };

  // Real-time updates
  useEffect(() => {
    fetchMatchRoom();
    
    const interval = setInterval(fetchMatchRoom, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, [matchId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading match room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-900 border border-red-600 text-red-300 px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/matchmaking')}
            className="mt-4 btn-secondary"
          >
            Back to Matchmaking
          </button>
        </div>
      </div>
    );
  }

  if (!matchRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Match room not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-valorant text-white mb-4 text-glow">
          MATCH ROOM
        </h1>
        <p className="text-valorant-gray-300 text-lg">
          Match ID: {matchRoom.id}
        </p>
        <p className="text-valorant-gray-400">
          Status: <span className="text-valorant-red capitalize">{matchRoom.status.replace('_', ' ')}</span>
        </p>
      </div>

      {/* Players List */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-valorant-dark-secondary border border-valorant-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Players in Match</h2>
          <div className="space-y-3">
            {matchRoom.players.map((player, index) => (
              <div 
                key={player.user_id || index}
                className="flex items-center justify-between bg-valorant-gray-800 p-3 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-valorant-red rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    {player.username?.charAt(0).toUpperCase() || 'P'}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {player.username || `Player ${index + 1}`}
                    </div>
                    <div className="text-xs text-valorant-gray-400">
                      ELO: {player.elo || 1200}
                    </div>
                  </div>
                </div>
                
                {/* Captain indicators */}
                {matchRoom.captain1 === player.user_id && (
                  <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    Captain 1
                  </span>
                )}
                {matchRoom.captain2 === player.user_id && (
                  <span className="bg-green-600 text-white px-2 py-1 rounded text-xs">
                    Captain 2
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Captain Selection */}
        <div className="bg-valorant-dark-secondary border border-valorant-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Captain Selection</h2>
          
          {matchRoom.status === 'created' && (
            <div className="space-y-4">
              <p className="text-valorant-gray-300 mb-4">
                How should captains be selected?
              </p>
              
              <button
                onClick={() => setCaptainSelectionMethod('random')}
                disabled={!!selectedCaptainMethod}
                className="btn-primary w-full mb-3"
              >
                Random Selection
              </button>
              
              <button
                onClick={() => setCaptainSelectionMethod('voting')}
                disabled={!!selectedCaptainMethod}
                className="btn-secondary w-full"
              >
                Vote for Captains
              </button>
              
              {selectedCaptainMethod && (
                <p className="text-green-400 text-sm mt-2">
                  Method selected: {selectedCaptainMethod}
                </p>
              )}
            </div>
          )}

          {matchRoom.status === 'captain_voting' && (
            <div className="space-y-4">
              <p className="text-valorant-gray-300 mb-4">
                Vote for your preferred captains:
              </p>
              
              <div className="space-y-2">
                {matchRoom.captain_candidates.map((candidateId) => (
                  <button
                    key={candidateId}
                    onClick={() => voteForCaptain(candidateId)}
                    disabled={!!votedCandidate}
                    className={`w-full p-3 rounded-lg border transition-colors ${
                      votedCandidate === candidateId
                        ? 'bg-valorant-red border-valorant-red text-white'
                        : 'bg-valorant-gray-800 border-valorant-gray-600 text-valorant-gray-300 hover:border-valorant-red'
                    }`}
                  >
                    {getPlayerName(candidateId)}
                    {votedCandidate === candidateId && (
                      <span className="ml-2">✓</span>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-valorant-gray-400">
                Votes: {Object.keys(matchRoom.captain_votes).length}/{matchRoom.players.length}
              </div>
            </div>
          )}

          {matchRoom.status === 'team_draft' && (
            <div className="space-y-4">
              <p className="text-green-400 text-lg font-medium">
                Captains Selected!
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-blue-900 rounded-lg">
                  <span className="text-white font-medium">Captain 1:</span>
                  <span className="text-blue-300">{getPlayerName(matchRoom.captain1)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-900 rounded-lg">
                  <span className="text-white font-medium">Captain 2:</span>
                  <span className="text-green-300">{getPlayerName(matchRoom.captain2)}</span>
                </div>
              </div>
              
              <p className="text-valorant-gray-400 text-sm mt-4">
                Team draft phase coming soon...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Information */}
      <div className="bg-valorant-gray-800 p-4 rounded-lg">
        <div className="text-sm text-valorant-gray-400">
          <p>Room expires: {new Date(matchRoom.expire_time).toLocaleString()}</p>
          <p>Last updated: {new Date(matchRoom.updated_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default MatchRoomComponent;