import { useState, useEffect, useCallback } from 'react';
import { QueueData, Match } from '../types';

interface UseMatchmakingReturn {
  isInQueue: boolean;
  queueData: QueueData | null;
  currentMatch: Match | null;
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useMatchmaking = (): UseMatchmakingReturn => {
  const [isInQueue, setIsInQueue] = useState(false);
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue status
  const fetchQueueStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8080/api/queue/status');
      const data = await response.json();
      
      if (data.success) {
        setQueueData(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch queue status');
      }
    } catch (err) {
      console.error('Error fetching queue status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Join queue - Note: This hook doesn't have access to user context, 
  // so this is mainly for demonstration. In practice, use the component version.
  const joinQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get or generate a unique user ID for this session
      let userID = localStorage.getItem('session-user-id');
      if (!userID) {
        userID = `temp-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('session-user-id', userID);
      }
      
      // For this hook, we'll use basic defaults since we don't have user context
      const username = 'TestUser'; // In real usage, get from user context
      const elo = 1200; // Default ELO for development
      
      console.log('Attempting to join queue with userID:', userID, 'username:', username);
      
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
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        // Store the user ID returned by backend (in case it was generated there)
        if (data.userID) {
          localStorage.setItem('session-user-id', data.userID);
        }
        setIsInQueue(true);
        await fetchQueueStatus();
      } else {
        throw new Error(data.message || 'Failed to join queue');
      }
    } catch (err) {
      console.error('Error joining queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to join queue');
    } finally {
      setLoading(false);
    }
  }, [fetchQueueStatus]);

  // Leave queue
  const leaveQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userID = localStorage.getItem('session-user-id');
      if (!userID) {
        throw new Error('No session found');
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
        setCurrentMatch(null);
        await fetchQueueStatus();
      } else {
        throw new Error(data.message || 'Failed to leave queue');
      }
    } catch (err) {
      console.error('Error leaving queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to leave queue');
    } finally {
      setLoading(false);
    }
  }, [fetchQueueStatus]);

  // Check for match ready
  const checkMatchReady = useCallback(async () => {
    if (!isInQueue || !queueData?.can_start_match) return;
    
    try {
      const response = await fetch('http://localhost:8080/api/match/current', {
        headers: {
          'X-User-ID': 'temp-user-id' // TODO: Get from auth context
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.data) {
        setCurrentMatch(data.data);
        setIsInQueue(false);
      }
    } catch (err) {
      console.error('Error checking for match:', err);
    }
  }, [isInQueue, queueData?.can_start_match]);

  // Auto-refresh queue status - now always runs for real-time updates
  useEffect(() => {
    // Initial fetch
    fetchQueueStatus();
    
    // Poll every 1 second for real-time updates
    const intervalId = setInterval(() => {
      fetchQueueStatus();
      if (isInQueue) {
        checkMatchReady();
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isInQueue, fetchQueueStatus, checkMatchReady]);

  return {
    isInQueue,
    queueData,
    currentMatch,
    joinQueue,
    leaveQueue,
    loading,
    error
  };
};