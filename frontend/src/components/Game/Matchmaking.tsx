import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { QueueData, Match } from '../../types';
import MatchAcceptance from './MatchAcceptance';

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
  const [foundMatch, setFoundMatch] = useState<Match | null>(null);
  const [showAcceptance, setShowAcceptance] = useState(false);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

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

  // Check if player has a pending match
  const checkForPendingMatch = async () => {
    try {
      const userID = localStorage.getItem('session-user-id');
      const response = await fetch('http://localhost:8080/api/match-room/player', {
        headers: {
          'X-User-ID': userID || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.match) {
          console.log('📢 Found pending match for player:', data.data.match);
          
          // Player has a pending match - show acceptance popup
          setFoundMatch(data.data.match);
          setShowAcceptance(true);
          setCurrentMatch(data.data.match);
          setIsInQueue(false);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking for pending match:', error);
      return false;
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
      // Get stored user ID or create one based on user's email
      let userID = localStorage.getItem('session-user-id');
      if (!userID) {
        // Use email-based ID for consistency
        userID = `user-${user.email.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`;
        localStorage.setItem('session-user-id', userID);
      }
      
      // Use real user data
      const username = user.username || user.email.split('@')[0];
      const elo = user.elo || 1200;
      
      console.log('Joining queue with:', { userID, username, elo });
      
      const response = await fetch('http://localhost:8080/api/queue/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userID,
          'X-Username': username,
          'X-User-ELO': elo.toString()
        },
        body: JSON.stringify({
          username: username,
          elo: elo
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store the user ID returned by backend (in case it was generated there)
        if (data.userID) {
          localStorage.setItem('session-user-id', data.userID);
        }
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
    setError('');
    
    try {
      const userID = localStorage.getItem('session-user-id');
      if (!userID) {
        setError('No session found');
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:8080/api/queue/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userID
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success !== false) {
        setIsInQueue(false);
        fetchQueueStatus();
      } else {
        setError(data.message || 'Failed to leave queue');
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
    // Prevent multiple simultaneous match creation attempts
    if (isCreatingMatch) {
      console.log('Match creation already in progress, skipping...');
      return;
    }
    
    setIsCreatingMatch(true);
    
    try {
      console.log('Attempting to create match...');
      const userID = localStorage.getItem('session-user-id');
      const response = await fetch('http://localhost:8080/api/match-room/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userID || ''
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Parsed data:', data);
      console.log('data.success:', data.success);
      console.log('data.data:', data.data);
      console.log('data.data.match:', data.data?.match);
      
      if (response.ok && data.success && data.data && data.data.match) {
        console.log('✅ Match created successfully:', data.data.match);
        
        // Show acceptance popup instead of immediately navigating
        setFoundMatch(data.data.match);
        setShowAcceptance(true);
        setCurrentMatch(data.data.match);
        setIsInQueue(false);
      } else {
        console.log('❌ Failed to create match:', data.message || data.data?.message);
        setError(data.message || data.data?.message || 'Failed to create match room');
      }
    } catch (error) {
      console.error('Error creating match room:', error);
      setError('Failed to create match room');
    } finally {
      setIsCreatingMatch(false);
    }
  };

  // Real-time queue updates and match detection
  useEffect(() => {
    const pollForUpdates = async () => {
      // First check if player has a pending match
      if (isInQueue && !showAcceptance && !currentMatch) {
        const hasPendingMatch = await checkForPendingMatch();
        if (hasPendingMatch) {
          return; // Stop polling queue if we found a match
        }
      }
      
      // Then check queue status
      await fetchQueueStatus();
    };

    // Initial fetch
    pollForUpdates();
    
    // Set up polling for real-time updates
    const interval = setInterval(pollForUpdates, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isInQueue, showAcceptance, currentMatch]); // Dependencies to re-run when these change

  // Check for match room creation when queue data changes
  useEffect(() => {
    if (queueData.should_create_match && isInQueue && queueData.players_in_queue === 2 && !currentMatch && !isCreatingMatch) { // TEMPORARY: Changed from 10 to 2
      createMatch();
    }
  }, [queueData.should_create_match, queueData.players_in_queue, isInQueue, currentMatch, isCreatingMatch]);

  const handleMatchAccept = () => {
    console.log('Match accepted');
    // The acceptance is handled by the MatchAcceptance component
    // We can add additional logic here if needed
  };

  const handleMatchDecline = () => {
    console.log('Match declined');
    setFoundMatch(null);
    setShowAcceptance(false);
    setCurrentMatch(null);
    setError('Match was declined. You have been returned to the queue.');
  };

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

      {queueData.is_queue_full && !isInQueue && (
        <div className="bg-orange-900 border border-orange-600 text-orange-300 px-4 py-2 rounded mb-6">
          Queue is currently full. Please wait for the current match to start before joining.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Queue Controls */}
        <div className="bg-valorant-dark-secondary border border-valorant-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Queue Status</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-valorant-gray-300">Players in Queue:</span>
              <span className="text-white font-medium">{queueData.players_in_queue}/{queueData.max_players || 10}</span>
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
              className={`h-2 rounded-full transition-all duration-300 ${
                queueData.is_queue_full 
                  ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                  : 'bg-valorant-red'
              }`}
              style={{ width: `${(queueData.players_in_queue / (queueData.max_players || 10)) * 100}%` }}
            />
          </div>

          {!isInQueue ? (
            <button
              onClick={joinQueue}
              disabled={loading || queueData.is_queue_full}
              className={`w-full ${
                queueData.is_queue_full 
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              {loading ? 'Joining...' : queueData.is_queue_full ? 'QUEUE FULL' : 'JOIN QUEUE'}
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

      {/* Match Acceptance Popup */}
      {showAcceptance && foundMatch && (
        <MatchAcceptance
          match={foundMatch}
          onAccept={handleMatchAccept}
          onDecline={handleMatchDecline}
        />
      )}
    </div>
  );
};

export default Matchmaking;
