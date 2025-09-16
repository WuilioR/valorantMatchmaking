import React from 'react';
import { QueueData } from '../../types';

interface QueueStatusProps {
  queueData: QueueData;
  isInQueue: boolean;
}

const QueueStatus: React.FC<QueueStatusProps> = ({ queueData, isInQueue }) => {
  const maxPlayers = queueData.max_players || 10;
  const progressPercentage = Math.min((queueData.players_in_queue / maxPlayers) * 100, 100);

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-white">Queue Status</h2>
      
      {/* Queue Full Warning */}
      {queueData.is_queue_full && (
        <div className="mb-4 p-3 bg-orange-900 border border-orange-600 text-orange-300 rounded-lg">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-400 rounded-full mr-2 animate-pulse"></div>
            Queue is full! New queue will start after match begins.
          </div>
        </div>
      )}
      
      {/* Players Count */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-valorant-gray-300">Players Ready</span>
          <span className="text-white font-bold">
            {queueData.players_in_queue}/{maxPlayers}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-valorant-gray-800 rounded-full h-3 mb-4">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${
              queueData.is_queue_full 
                ? 'bg-gradient-to-r from-orange-500 to-red-500' 
                : 'bg-gradient-to-r from-valorant-red to-orange-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {queueData.can_start_match && (
          <div className="text-center">
            <div className="inline-flex items-center bg-valorant-red text-white px-4 py-2 rounded-lg animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full mr-2"></div>
              MATCH READY
            </div>
          </div>
        )}
      </div>

      {/* Player List */}
      {queueData.players && queueData.players.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-3">Players in Queue</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {queueData.players.map((player, index) => (
              <div 
                key={player.id || index}
                className="flex items-center justify-between bg-valorant-gray-800 p-3 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-valorant-red rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                    {player.username ? player.username.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {player.username || `Player ${index + 1}`}
                    </div>
                    {player.elo && (
                      <div className={`elo-badge elo-${getRankFromElo(player.elo)}`}>
                        {getRankFromElo(player.elo).toUpperCase()} - {player.elo}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm">Ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Info */}
      <div className="bg-valorant-gray-800 p-4 rounded-lg">
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-valorant-gray-400">Estimated Wait:</span>
            <span className="text-white font-medium">{queueData.estimated_wait}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-valorant-gray-400">Queue Type:</span>
            <span className="text-white font-medium">Competitive</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-valorant-gray-400">Status:</span>
            <span className={`font-medium ${isInQueue ? 'text-green-400' : 'text-valorant-gray-400'}`}>
              {isInQueue ? 'In Queue' : 'Not in Queue'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get rank from ELO
const getRankFromElo = (elo: number): string => {
  if (elo >= 2000) return 'radiant';
  if (elo >= 1800) return 'immortal';
  if (elo >= 1600) return 'diamond';
  if (elo >= 1400) return 'platinum';
  if (elo >= 1200) return 'gold';
  if (elo >= 1000) return 'silver';
  if (elo >= 800) return 'bronze';
  return 'iron';
};

export default QueueStatus;