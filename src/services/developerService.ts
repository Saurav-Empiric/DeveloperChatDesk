import axios, { AxiosError } from 'axios';


  /**
   * Get all developers
   */
  export const  getDevelopers = async (): Promise<DeveloperResponse> => {
    try {
      const response = await axios.get('/api/developers');
      return { 
        success: true, 
        developers: response.data.developers 
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.error || 
                          'Failed to fetch developers';
      console.error('Error fetching developers:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Add a new developer
   */
  export const addDeveloper = async (data: DeveloperData): Promise<DeveloperResponse> => {
    try {
      const response = await axios.post('/api/developers', data);
      return { 
        success: true, 
        message: 'Developer added successfully',
        developer: response.data.developer
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.error || 
                          'Failed to add developer';
      console.error('Error adding developer:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete a developer
   */
  export const deleteDeveloper = async (id: string): Promise<DeveloperResponse> => {
    try {
      const response = await axios.delete(`/api/developers?id=${id}`);
      return { 
        success: true, 
        message: 'Developer deleted successfully' 
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.error || 
                          'Failed to delete developer';
      console.error('Error deleting developer:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get developer's assigned chats with WhatsApp details
   */
  export const getDeveloperAssignedChats = async (): Promise<{
    success: boolean;
    chats?: any[];
    error?: string;
  }> => {
    try {
      const response = await axios.get('/api/developer/chats');
      return {
        success: true,
        chats: response.data.chats
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const errorMessage = axiosError.response?.data?.error ||
        'Failed to fetch assigned chats';
      console.error('Error fetching developer assigned chats:', error);
      return { success: false, error: errorMessage };
    }
  }