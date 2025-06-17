import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

// Define types for API responses
export interface Vendor {
  _id: string;
  name?: string;
  businessName?: string;
  vendorName?: string;
  contactNumber: string;
  email?: string;
  mapsLink?: string;
  operatingHours?: any;
  updatedAt?: string;
  foodType?: 'veg' | 'non-veg' | 'swaminarayan' | 'jain' | 'none';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Create axios instance with default config
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.DEV 
      ? 'http://localhost:3000' 
      : 'https://laari-khojo-backend.onrender.com',
    timeout: 10000, // 10 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add retry logic
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { _retry?: number };
      
      // Initialize retry count if not set
      config._retry = config._retry || 0;
      
      // Only retry on network errors or 5xx server errors
      if (
        (error.code === 'ECONNABORTED' || 
         (error.response && error.response.status >= 500)) && 
        config._retry < 3
      ) {
        config._retry += 1;
        
        // Exponential backoff delay
        const delay = Math.min(1000 * Math.pow(2, config._retry), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return instance(config);
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create the API client instance
const apiClient = createAxiosInstance();

// Helper function to handle API responses consistently
export const handleApiResponse = async <T>(promise: Promise<{ data: { data: T } }>): Promise<ApiResponse<T>> => {
  try {
    const response = await promise;
    return {
      success: true,
      data: response.data.data,
      error: null
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: string; msg?: string }>;
      return {
        success: false,
        data: null,
        error: axiosError.response?.data?.error || 
               axiosError.response?.data?.msg || 
               axiosError.message || 
               'An unexpected error occurred'
      };
    }
    return {
      success: false,
      data: null,
      error: 'An unexpected error occurred'
    };
  }
};

// API methods
export const api = {
  getAllUsers: () => handleApiResponse<Vendor[]>(apiClient.get('/api/all-users')),
  login: (credentials: { email: string; password: string }) => 
    handleApiResponse<{ accessToken: string }>(apiClient.post('/api/login', credentials)),
  register: (userData: Omit<Vendor, '_id'>) => 
    handleApiResponse<Vendor>(apiClient.post('/api/register', userData)),
  // Add other API methods as needed
};

export default api; 