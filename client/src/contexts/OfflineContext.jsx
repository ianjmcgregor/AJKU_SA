import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const OfflineContext = createContext();

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncItems, setPendingSyncItems] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing data...');
      syncPendingData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Data will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending sync items from localStorage
    loadPendingSyncItems();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPendingSyncItems = () => {
    try {
      const items = localStorage.getItem('pendingSyncItems');
      if (items) {
        setPendingSyncItems(JSON.parse(items));
      }
    } catch (error) {
      console.error('Error loading pending sync items:', error);
    }
  };

  const savePendingSyncItems = (items) => {
    try {
      localStorage.setItem('pendingSyncItems', JSON.stringify(items));
      setPendingSyncItems(items);
    } catch (error) {
      console.error('Error saving pending sync items:', error);
    }
  };

  const addToSyncQueue = (table, action, data) => {
    const syncItem = {
      id: Date.now() + Math.random(), // Simple ID generation
      table,
      action,
      data,
      timestamp: new Date().toISOString(),
      synced: false
    };

    const newItems = [...pendingSyncItems, syncItem];
    savePendingSyncItems(newItems);
    
    if (isOnline) {
      // Try to sync immediately if online
      syncPendingData();
    }

    return syncItem.id;
  };

  const syncPendingData = async () => {
    if (syncing || pendingSyncItems.length === 0) return;

    setSyncing(true);
    
    try {
      const unsyncedItems = pendingSyncItems.filter(item => !item.synced);
      
      if (unsyncedItems.length === 0) {
        setSyncing(false);
        return;
      }

      const response = await axios.post('/api/sync/upload', {
        syncData: unsyncedItems.map(item => ({
          client_id: item.id,
          table: item.table,
          action: item.action,
          data: item.data
        }))
      });

      const results = response.data.results || [];
      
      // Update sync status based on results
      const updatedItems = pendingSyncItems.map(item => {
        const result = results.find(r => r.client_id === item.id);
        if (result) {
          return {
            ...item,
            synced: result.success,
            error: result.success ? null : result.error,
            server_id: result.server_id
          };
        }
        return item;
      });

      // Remove successfully synced items after a delay
      const remainingItems = updatedItems.filter(item => !item.synced);
      savePendingSyncItems(remainingItems);

      const syncedCount = updatedItems.length - remainingItems.length;
      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} items successfully`);
      }

      const failedCount = remainingItems.filter(item => item.error).length;
      if (failedCount > 0) {
        toast.error(`Failed to sync ${failedCount} items`);
      }

    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed. Will retry when connection is stable.');
    } finally {
      setSyncing(false);
    }
  };

  const clearSyncQueue = () => {
    savePendingSyncItems([]);
    toast.success('Sync queue cleared');
  };

  const offlineStorage = {
    get: (key) => {
      try {
        const data = localStorage.getItem(`offline_${key}`);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error reading from offline storage:', error);
        return null;
      }
    },

    set: (key, data) => {
      try {
        localStorage.setItem(`offline_${key}`, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error writing to offline storage:', error);
        return false;
      }
    },

    remove: (key) => {
      try {
        localStorage.removeItem(`offline_${key}`);
        return true;
      } catch (error) {
        console.error('Error removing from offline storage:', error);
        return false;
      }
    },

    clear: () => {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('offline_')) {
            localStorage.removeItem(key);
          }
        });
        return true;
      } catch (error) {
        console.error('Error clearing offline storage:', error);
        return false;
      }
    }
  };

  const value = {
    isOnline,
    pendingSyncItems,
    syncing,
    addToSyncQueue,
    syncPendingData,
    clearSyncQueue,
    offlineStorage
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};