import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../../types';

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'weekly' | 'monthly'>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchLeaderboard();
  }, [filter]);

  // Real-time updates - poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(true); // silent update
    }, 10000);

    return () => clearInterval(interval);
  }, [filter]);

  const fetchLeaderboard = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/leaderboard?period=' + filter);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.data || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '#' + position;
    }
  };

  const getRankFromElo = (elo: number): { name: string; color: string; icon: string } => {
    if (elo >= 2000) return { name: 'RADIANT', color: 'text-yellow-300', icon: '⚡' };
    if (elo >= 1800) return { name: 'IMMORTAL', color: 'text-purple-400', icon: '💎' };
    if (elo >= 1600) return { name: 'DIAMOND', color: 'text-cyan-300', icon: '💠' };
    if (elo >= 1400) return { name: 'PLATINUM', color: 'text-emerald-300', icon: '🔷' };
    if (elo >= 1200) return { name: 'GOLD', color: 'text-yellow-400', icon: '🟨' };
    if (elo >= 1000) return { name: 'SILVER', color: 'text-gray-300', icon: '⬜' };
    if (elo >= 800) return { name: 'BRONZE', color: 'text-orange-400', icon: '🟫' };
    return { name: 'IRON', color: 'text-gray-500', icon: '⬛' };
  };

  const getRankDisplay = (elo: number) => {
    const rank = getRankFromElo(elo);
    return (
      <div className="flex items-center">
        <span className="text-lg mr-2">{rank.icon}</span>
        <span className={`text-sm font-bold ${rank.color}`}>
          {rank.name}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-300">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl text-white mb-4">LEADERBOARD</h1>
        <p className="text-gray-300">Top players ranked by ELO rating</p>
        <div className="flex items-center justify-center mt-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-800 p-1 rounded-lg inline-flex">
          {(['all', 'weekly', 'monthly'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilter(period)}
              className={`px-6 py-2 rounded-md transition-all duration-200 font-medium capitalize ${
                filter === period 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              {period === 'all' ? 'All Time' : period}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-800 border rounded-lg overflow-hidden">
        <div className="bg-gray-900 border-b px-6 py-4">
          <div className="grid grid-cols-5 gap-4 text-sm font-semibold text-red-500 uppercase tracking-wider">
            <div>RANK</div>
            <div className="col-span-2">PLAYER</div>
            <div>ELO</div>
            <div>GAMES</div>
          </div>
        </div>

        <div className="divide-y divide-gray-700">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No leaderboard data available</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => {
              const position = index + 1;
              const totalGames = (entry.wins || 0) + (entry.losses || 0);
              
              return (
                <div 
                  key={entry.userId} 
                  className={`px-6 py-4 hover:bg-gray-700 transition-colors ${
                    position <= 3 ? 'bg-gradient-to-r from-red-600/10 to-transparent border-l-4 border-red-600' : ''
                  }`}
                >
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="flex items-center">
                      <span className="text-xl mr-2">{getRankIcon(position)}</span>
                      <span className="text-white font-bold">
                        {position <= 3 ? '' : '#' + position}
                      </span>
                    </div>

                    <div className="col-span-2 flex items-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold mr-3">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium text-lg">{entry.username}</div>
                        {getRankDisplay(entry.elo)}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-red-500 font-bold text-xl">{entry.elo}</div>
                      <div className="text-gray-400 text-xs">Rating</div>
                    </div>

                    <div className="text-center">
                      <div className="text-white font-medium">{totalGames}</div>
                      <div className="text-gray-400 text-xs">
                        {entry.wins || 0}W / {entry.losses || 0}L
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 grid md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Total Players</h3>
          <div className="text-3xl font-bold text-red-500">{leaderboard.length}</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Average ELO</h3>
          <div className="text-3xl font-bold text-red-500">
            {leaderboard.length > 0 
              ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.elo, 0) / leaderboard.length)
              : 0
            }
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Top Player</h3>
          <div className="text-xl font-bold text-white">
            {leaderboard.length > 0 ? leaderboard[0].username : 'N/A'}
          </div>
          <div className="text-gray-400">
            {leaderboard.length > 0 ? `${leaderboard[0].elo} ELO` : ''}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
