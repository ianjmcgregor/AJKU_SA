import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    method = 'GET',
    payload = null,
    immediate = true,
    onSuccess = null,
    onError = null,
    showToast = true
  } = options;

  const execute = async (customPayload = null) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const config = {
        method,
        url,
        headers,
        ...(payload || customPayload ? { data: payload || customPayload } : {})
      };

      const response = await axios(config);
      
      setData(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      if (showToast && method !== 'GET') {
        toast.success('Operation completed successfully');
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'An error occurred';
      setError(errorMessage);
      
      if (onError) {
        onError(errorMessage);
      }
      
      if (showToast) {
        toast.error(errorMessage);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (immediate && method === 'GET') {
      execute();
    }
  }, [url, immediate]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute
  };
};

export default useApi;