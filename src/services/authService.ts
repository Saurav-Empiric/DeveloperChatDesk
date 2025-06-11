import axios, { AxiosError } from 'axios';

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  canRegister?: boolean;
  user?: any;
}

export const authService = {
  /**
   * Get the registration status
   */
  getRegistrationStatus: async (): Promise<AuthResponse> => {
    try {
      const response = await axios.get('/api/auth/registration-status');
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.error || 
                          'Failed to check registration status';
      console.error('Error checking registration status:', error);
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Register a new user
   */
  register: async (data: RegistrationData): Promise<AuthResponse> => {
    try {
      const response = await axios.post('/api/auth/register', data);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.error || 
                          'An error occurred during registration';
      console.error('Registration error:', error);
      return { success: false, error: errorMessage };
    }
  },
}; 