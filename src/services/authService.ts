import axios, { AxiosError } from 'axios';

/**
 * Get the registration status
 */
export const getRegistrationStatus = async (): Promise<AuthResponse> => {
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
}

/**
 * Register a new user
 */
export const register = async (data: UserRegistrationData): Promise<AuthResponse> => {
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
}

/**
 * Request a password reset
 */
export const requestPasswordReset = async (
  email: string, 
  role?: 'admin' | 'developer'
): Promise<AuthResponse> => {
  try {
    const response = await axios.post('/api/auth/forgot-password', { email, role });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'An error occurred while requesting password reset';
    console.error('Password reset request error:', error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Reset password using token
 */
export const resetPassword = async (data: PasswordResetData): Promise<AuthResponse> => {
  try {
    const response = await axios.post('/api/auth/reset-password', data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const errorMessage = axiosError.response?.data?.error ||
      'An error occurred while resetting password';
    console.error('Password reset error:', error);
    return { success: false, error: errorMessage };
  }
}
