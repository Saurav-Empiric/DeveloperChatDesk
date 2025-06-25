import axios, { AxiosError } from 'axios';

export interface WahaStatus {
  status: string;
  message: string;
  isRunning: boolean;
  version?: string;
  wahaApiUrl?: string;
  errorMessage?: string;
}

export interface SystemResponse {
  success: boolean;
  error?: string;
  wahaStatus?: WahaStatus;
}


/**
 * Get Waha API status
 */
export const getWahaStatus = async (): Promise<SystemResponse> => {
  try {
    const response = await axios.get('/api/system/waha-status');
    return {
      success: true,
      wahaStatus: response.data
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'Failed to check WAHA service status';
    console.error('Error checking WAHA status:', error);
    return {
      success: false,
      error: errorMessage,
      wahaStatus: {
        status: 'error',
        message: errorMessage,
        isRunning: false
      }
    };
  }
}