import { apiClient } from './api';

/**
 * Test API connectivity
 * This function tests connectivity to the API endpoint
 */
export async function testApiConnection() {
  try {
    console.log('Testing API connection...');
    console.log('Base URL:', import.meta.env.VITE_API_BASE_URL);

    // Try to fetch tickets
    await apiClient.get('/api/tickets');
    console.log('✅ Successfully connected to API server!');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to API server:', error);
    return false;
  }
}

/**
 * Call this function on app startup to check connectivity
 */
export function checkApiConnectivity() {
  setTimeout(() => {
    testApiConnection().then(success => {
      if (success) {
        console.log('API connectivity check passed');
      } else {
        console.error('API connectivity check failed - please check server connection');
      }
    });
  }, 1000);  // Wait for 1 second after app loads
} 