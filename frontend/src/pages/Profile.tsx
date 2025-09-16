import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className='min-h-screen bg-valorant-dark py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-valorant text-white mb-4 text-glow'>PLAYER PROFILE</h1>
          <p className='text-valorant-gray-300'>View your stats and progress</p>
        </div>

        {/* User Info Card */}
        <div className='bg-valorant-gray-800 rounded-lg p-6 border border-valorant-red/20 mb-8'>
          <div className='flex items-center space-x-6'>
            {/* Avatar */}
            <div className='w-20 h-20 bg-valorant-red rounded-full flex items-center justify-center'>
              <span className='text-2xl font-bold text-white'>
                {user?.username ? user.username.charAt(0).toUpperCase() : 'P'}
              </span>
            </div>
            
            {/* User Details */}
            <div className='flex-1'>
              <h2 className='text-2xl font-bold text-white mb-2'>
                {user?.username || 'Player'}
              </h2>
              <p className='text-valorant-gray-300 mb-1'>
                {user?.email || 'No email'}
              </p>
              <div className='flex items-center space-x-4'>
                <span className='px-3 py-1 bg-valorant-red/20 text-valorant-red rounded-full text-sm font-medium'>
                  GOLD
                </span>
                <span className='text-sm text-valorant-gray-400'>
                  Last updated: 2 minutes ago
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {/* ELO Rating */}
          <div className='bg-valorant-gray-800 rounded-lg p-6 border border-valorant-gray-600 text-center'>
            <div className='text-3xl font-bold text-valorant-red mb-2'>1250</div>
            <div className='text-sm text-valorant-gray-400 uppercase tracking-wide'>ELO Rating</div>
            <div className='text-xs text-green-400 mt-1'>+25 today</div>
          </div>

          {/* Wins */}
          <div className='bg-valorant-gray-800 rounded-lg p-6 border border-valorant-gray-600 text-center'>
            <div className='text-3xl font-bold text-green-400 mb-2'>47</div>
            <div className='text-sm text-valorant-gray-400 uppercase tracking-wide'>Total Wins</div>
            <div className='text-xs text-green-400 mt-1'>+3 this week</div>
          </div>

          {/* Losses */}
          <div className='bg-valorant-gray-800 rounded-lg p-6 border border-valorant-gray-600 text-center'>
            <div className='text-3xl font-bold text-red-400 mb-2'>23</div>
            <div className='text-sm text-valorant-gray-400 uppercase tracking-wide'>Total Losses</div>
            <div className='text-xs text-red-400 mt-1'>+1 this week</div>
          </div>

          {/* Win Rate */}
          <div className='bg-valorant-gray-800 rounded-lg p-6 border border-valorant-gray-600 text-center'>
            <div className='text-3xl font-bold text-blue-400 mb-2'>67%</div>
            <div className='text-sm text-valorant-gray-400 uppercase tracking-wide'>Win Rate</div>
            <div className='text-xs text-blue-400 mt-1'>Above average</div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className='bg-valorant-gray-800 rounded-lg p-6 border border-valorant-gray-600'>
          <h3 className='text-xl font-bold text-white mb-6'>Recent Matches</h3>
          <div className='space-y-4'>
            {/* Match 1 */}
            <div className='flex items-center justify-between p-4 bg-valorant-gray-900 rounded-lg border border-valorant-gray-700'>
              <div className='flex items-center space-x-4'>
                <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                <div>
                  <div className='text-white font-medium'>Victory</div>
                  <div className='text-sm text-valorant-gray-400'>Bind • 2 hours ago</div>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-green-400 font-bold'>+18 ELO</div>
                <div className='text-sm text-valorant-gray-400'>13-7</div>
              </div>
            </div>

            {/* Match 2 */}
            <div className='flex items-center justify-between p-4 bg-valorant-gray-900 rounded-lg border border-valorant-gray-700'>
              <div className='flex items-center space-x-4'>
                <div className='w-2 h-2 bg-red-400 rounded-full'></div>
                <div>
                  <div className='text-white font-medium'>Defeat</div>
                  <div className='text-sm text-valorant-gray-400'>Haven • 5 hours ago</div>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-red-400 font-bold'>-12 ELO</div>
                <div className='text-sm text-valorant-gray-400'>8-13</div>
              </div>
            </div>

            {/* Match 3 */}
            <div className='flex items-center justify-between p-4 bg-valorant-gray-900 rounded-lg border border-valorant-gray-700'>
              <div className='flex items-center space-x-4'>
                <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                <div>
                  <div className='text-white font-medium'>Victory</div>
                  <div className='text-sm text-valorant-gray-400'>Split • 1 day ago</div>
                </div>
              </div>
              <div className='text-right'>
                <div className='text-green-400 font-bold'>+22 ELO</div>
                <div className='text-sm text-valorant-gray-400'>13-10</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
