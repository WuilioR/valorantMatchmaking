import React, { useState, useEffect } from 'react';
import { Match, Player } from '../../types';

interface GameLobbyProps {
  match: Match;
}

type LobbyPhase = 'captain_select' | 'pick_players' | 'ban_maps' | 'pick_map' | 'loading';

const valorantMaps = [
  { id: 'bind', name: 'Bind' },
  { id: 'haven', name: 'Haven' },
  { id: 'split', name: 'Split' },
  { id: 'ascent', name: 'Ascent' },
  { id: 'icebox', name: 'Icebox' },
  { id: 'breeze', name: 'Breeze' },
  { id: 'fracture', name: 'Fracture' },
  { id: 'pearl', name: 'Pearl' },
  { id: 'lotus', name: 'Lotus' },
  { id: 'sunset', name: 'Sunset' }
];

const GameLobby: React.FC<GameLobbyProps> = ({ match }) => {
  const [phase, setPhase] = useState<LobbyPhase>('captain_select');
  const [team1, setTeam1] = useState<Player[]>([]);
  const [team2, setTeam2] = useState<Player[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [bannedMaps, setBannedMaps] = useState<string[]>([]);
  const [selectedMap, setSelectedMap] = useState<string>('');
  const [currentTurn, setCurrentTurn] = useState<'team1' | 'team2'>('team1');
  const [timeLeft, setTimeLeft] = useState(30);

  // Mock players for demo
  useEffect(() => {
    const mockPlayers: Player[] = [
      { id: '1', username: 'PlayerOne', elo: 1450 },
      { id: '2', username: 'ProGamer', elo: 1620 },
      { id: '3', username: 'ValorantKing', elo: 1380 },
      { id: '4', username: 'SharpShooter', elo: 1505 },
      { id: '5', username: 'TacticalMind', elo: 1445 },
      { id: '6', username: 'RifleExpert', elo: 1590 },
      { id: '7', username: 'ClutchMaster', elo: 1420 },
      { id: '8', username: 'EntryFragger', elo: 1515 },
      { id: '9', username: 'IGL_Leader', elo: 1600 },
      { id: '10', username: 'SupportPlayer', elo: 1460 }
    ];
    setAvailablePlayers(mockPlayers);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto-pick/ban when time runs out
      handleTimeOut();
    }
  }, [timeLeft]);

  const handleTimeOut = () => {
    if (phase === 'captain_select') {
      // Auto-select captains
      const captains = availablePlayers.slice(0, 2);
      setTeam1([captains[0]]);
      setTeam2([captains[1]]);
      setAvailablePlayers(prev => prev.slice(2));
      setPhase('pick_players');
      setTimeLeft(30);
    } else if (phase === 'pick_players') {
      // Auto-pick random player
      if (availablePlayers.length > 0) {
        pickPlayer(availablePlayers[0].id);
      }
    } else if (phase === 'ban_maps') {
      // Auto-ban random map
      const availableMaps = valorantMaps.filter(map => !bannedMaps.includes(map.id));
      if (availableMaps.length > 0) {
        banMap(availableMaps[0].id);
      }
    }
  };

  const selectCaptain = (playerId: string) => {
    const player = availablePlayers.find(p => p.id === playerId);
    if (!player) return;

    if (team1.length === 0) {
      setTeam1([player]);
      setCurrentTurn('team2');
    } else if (team2.length === 0) {
      setTeam2([player]);
      setPhase('pick_players');
      setCurrentTurn('team1');
    }

    setAvailablePlayers(prev => prev.filter(p => p.id !== playerId));
    setTimeLeft(30);
  };

  const pickPlayer = (playerId: string) => {
    const player = availablePlayers.find(p => p.id === playerId);
    if (!player) return;

    if (currentTurn === 'team1' && team1.length < 5) {
      setTeam1(prev => [...prev, player]);
    } else if (currentTurn === 'team2' && team2.length < 5) {
      setTeam2(prev => [...prev, player]);
    }

    setAvailablePlayers(prev => prev.filter(p => p.id !== playerId));
    
    // Switch turns or move to next phase
    if (team1.length + team2.length === 9) { // 8 players picked (excluding captains)
      setPhase('ban_maps');
      setCurrentTurn('team1');
    } else {
      setCurrentTurn(currentTurn === 'team1' ? 'team2' : 'team1');
    }
    
    setTimeLeft(30);
  };

  const banMap = (mapId: string) => {
    setBannedMaps(prev => [...prev, mapId]);
    
    const remainingMaps = valorantMaps.filter(map => ![...bannedMaps, mapId].includes(map.id));
    
    if (remainingMaps.length === 1) {
      setSelectedMap(remainingMaps[0].id);
      setPhase('loading');
    } else {
      setCurrentTurn(currentTurn === 'team1' ? 'team2' : 'team1');
    }
    
    setTimeLeft(30);
  };

  const renderCaptainSelect = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Captain Selection</h2>
        <p className="text-valorant-gray-300">
          {team1.length === 0 ? 'Select Team 1 Captain' : 'Select Team 2 Captain'}
        </p>
        <div className="text-4xl font-bold text-valorant-red mt-2">{timeLeft}s</div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {availablePlayers.map(player => (
          <div
            key={player.id}
            onClick={() => selectCaptain(player.id)}
            className="bg-valorant-gray-800 hover:bg-valorant-gray-700 p-4 rounded-lg cursor-pointer transition-all duration-200 hover:border-valorant-red border border-transparent"
          >
            <div className="text-white font-medium">{player.username}</div>
            <div className="text-valorant-gray-400 text-sm">ELO: {player.elo}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPlayerPicks = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Player Draft</h2>
        <p className="text-valorant-gray-300">
          {currentTurn === 'team1' ? 'Team 1' : 'Team 2'} is picking
        </p>
        <div className="text-4xl font-bold text-valorant-red mt-2">{timeLeft}s</div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Team 1 */}
        <div className="bg-blue-900 bg-opacity-50 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-blue-300 mb-3">Team 1</h3>
          {team1.map((player, index) => (
            <div key={player.id} className="flex items-center mb-2">
              {index === 0 && <span className="text-yellow-400 mr-2">👑</span>}
              <span className="text-white">{player.username}</span>
            </div>
          ))}
        </div>

        {/* Available Players */}
        <div className="bg-valorant-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-white mb-3">Available Players</h3>
          <div className="space-y-2">
            {availablePlayers.map(player => (
              <div
                key={player.id}
                onClick={() => pickPlayer(player.id)}
                className="bg-valorant-gray-700 hover:bg-valorant-red p-3 rounded cursor-pointer transition-all duration-200"
              >
                <div className="text-white font-medium">{player.username}</div>
                <div className="text-valorant-gray-400 text-sm">ELO: {player.elo}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Team 2 */}
        <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-red-300 mb-3">Team 2</h3>
          {team2.map((player, index) => (
            <div key={player.id} className="flex items-center mb-2">
              {index === 0 && <span className="text-yellow-400 mr-2">👑</span>}
              <span className="text-white">{player.username}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMapBans = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Map Ban Phase</h2>
        <p className="text-valorant-gray-300">
          {currentTurn === 'team1' ? 'Team 1' : 'Team 2'} is banning a map
        </p>
        <div className="text-4xl font-bold text-valorant-red mt-2">{timeLeft}s</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {valorantMaps.map(map => (
          <div
            key={map.id}
            onClick={() => !bannedMaps.includes(map.id) && banMap(map.id)}
            className={`
              relative p-4 rounded-lg transition-all duration-200 cursor-pointer
              ${bannedMaps.includes(map.id) 
                ? 'bg-red-900 opacity-50 cursor-not-allowed' 
                : 'bg-valorant-gray-800 hover:bg-valorant-gray-700 hover:border-valorant-red border border-transparent'
              }
            `}
          >
            <div className="text-white font-medium text-center">{map.name}</div>
            {bannedMaps.includes(map.id) && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-red-400 text-4xl">❌</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMapSelected = () => {
    const selectedMapData = valorantMaps.find(map => map.id === selectedMap);
    return (
      <div className="text-center space-y-6">
        <h2 className="text-3xl font-bold text-white mb-4">Map Selected!</h2>
        <div className="text-6xl font-valorant text-valorant-red mb-4 text-glow">
          {selectedMapData?.name}
        </div>
        <p className="text-valorant-gray-300 text-lg">Launching match...</p>
        <div className="spinner mx-auto"></div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-valorant-dark-900 rounded-xl p-8 border border-valorant-gray-700">
        {phase === 'captain_select' && renderCaptainSelect()}
        {phase === 'pick_players' && renderPlayerPicks()}
        {phase === 'ban_maps' && renderMapBans()}
        {phase === 'loading' && renderMapSelected()}
      </div>
    </div>
  );
};

export default GameLobby;