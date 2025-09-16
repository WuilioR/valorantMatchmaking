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

  // Join queue
  const joinQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate a unique user ID for this session
      const userID = localStorage.getItem('temp-user-id') || 'user-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('temp-user-id', userID);
      
      console.log('Attempting to join queue with userID:', userID);
      
      const response = await fetch('http://localhost:8080/api/queue/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userID
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok) {
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
      const response = await fetch('http://localhost:8080/api/queue/leave', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': 'temp-user-id' // TODO: Get from auth context
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
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

  // Auto-refresh queue status when in queue
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isInQueue) {
      // Poll every 3 seconds when in queue
      intervalId = setInterval(() => {
        fetchQueueStatus();
        checkMatchReady();
      }, 3000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isInQueue, fetchQueueStatus, checkMatchReady]);

  // Initial load
  useEffect(() => {
    fetchQueueStatus();
  }, [fetchQueueStatus]);

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