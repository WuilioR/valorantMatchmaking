import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import GameLobby from './GameLobby';
import { Match } from '../../types';
import { getMatchDetails } from '../../services/api';

const GameLobbyWrapper: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchMatch = async () => {
      if (!matchId) {
        setError('No match ID provided');
        setLoading(false);
        return;
      }

      try {
        const response = await getMatchDetails(matchId);
        if (response.success) {
          setMatch(response.data);
        } else {
          setError('Failed to load match details');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load match details');
      } finally {
        setLoading(false);
      }
    };

    fetchMatch();
  }, [matchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-valorant-red mx-auto mb-4"></div>
          <p className="text-valorant-gray-300">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-valorant-gray-300">No match found</p>
        </div>
      </div>
    );
  }

  return <GameLobby match={match} />;
};

export default GameLobbyWrapper;