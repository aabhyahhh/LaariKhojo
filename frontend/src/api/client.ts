import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { API_URL } from './config';

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
  profilePicture?: string;
  bestDishes?: Array<{ name: string; price?: number; menuLink?: string }>;
  category?: string[]; // Add category field for food categories
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface Review {
  _id?: string;
  vendorId: string;
  name: string;
  email: string;
  rating: number;
  comment?: string;
  createdAt?: string;
}

// Create axios instance with default config
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 15000, // Increased timeout to 15 seconds
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add retry logic with better error handling
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as AxiosRequestConfig & { _retry?: number };
      
      // Initialize retry count if not set
      config._retry = config._retry || 0;
      
      // Only retry on network errors, 5xx server errors, or 429 (rate limit)
      if (
        (error.code === 'ECONNABORTED' || 
         (error.response && (error.response.status >= 500 || error.response.status === 429))) && 
        config._retry < 3
      ) {
        config._retry += 1;
        
        // Exponential backoff delay with jitter
        const baseDelay = Math.min(1000 * Math.pow(2, config._retry), 10000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        console.log(`Retrying request (attempt ${config._retry}/3) after ${delay}ms delay`);
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
  getAllUsers: (page = 1, limit = 30) => handleApiResponse<Vendor[]>(apiClient.get(`/api/all-users?page=${page}&limit=${limit}`)),
  login: (credentials: { email: string; password: string }) => 
    handleApiResponse<{ accessToken: string }>(apiClient.post('/api/login', credentials)),
  register: (userData: Omit<Vendor, '_id'>) => 
    handleApiResponse<Vendor>(apiClient.post('/api/register', userData)),
  getReviews: (vendorId: string) => handleApiResponse<Review[]>(apiClient.get(`/api/reviews?vendorId=${vendorId}`)),
  addReview: (review: Omit<Review, '_id' | 'createdAt'>) => handleApiResponse<Review>(apiClient.post('/api/reviews', review)),
  // Add other API methods as needed
};

// Helper function to derive categories from vendor data
function deriveVendorCategories(vendor: any): string[] {
  const categories: string[] = [];
  
  // Check if vendor has bestDishes and derive categories from dish names
  if (Array.isArray(vendor.bestDishes) && vendor.bestDishes.length > 0) {
    // Lowercase and trim all dish names
    const dishNames = vendor.bestDishes
      .map((dish: any) => (dish.name || '').toLowerCase().trim())
      .join(' ');
    
    // Map dish names to categories
    if (dishNames.includes('chaat') || dishNames.includes('pani puri') || dishNames.includes('bhel puri') || dishNames.includes('dahi puri')) {
      categories.push('Chaat');
    }
    // Add Pani Puri as a separate category
    if (dishNames.includes('pani puri')) {
      categories.push('Pani Puri');
    }
    if (dishNames.includes('juice') || dishNames.includes('lassi') || dishNames.includes('milkshake') || dishNames.includes('smoothie')) {
      categories.push('Juices');
    }
    if (dishNames.includes('tea') || dishNames.includes('coffee') || dishNames.includes('chai')) {
      categories.push('Tea/coffee');
    }
    if (dishNames.includes('samosa') || dishNames.includes('vada pav') || dishNames.includes('pakora') || dishNames.includes('kebab')) {
      categories.push('Snacks (Samosa, Vada Pav, etc.)');
    }
    if (dishNames.includes('dessert') || dishNames.includes('gulab jamun') || dishNames.includes('rasgulla') || dishNames.includes('ice cream')) {
      categories.push('Dessert');
    }
    if (dishNames.includes('dhokla') || dishNames.includes('khandvi') || dishNames.includes('thepla') || dishNames.includes('fafda')) {
      categories.push('Gujju Snacks');
    }
    if (dishNames.includes('pav bhaji') || dishNames.includes('pavbhaji')) {
      categories.push('PavBhaji');
    }
    if (dishNames.includes('paratha') || dishNames.includes('parathe') || dishNames.includes('lassi') || dishNames.includes('butter chicken')) {
      categories.push('Punjabi (Parathe, Lassi, etc)');
    }
    // Improved Korean matching
    if (dishNames.includes('korean') || dishNames.includes('kimchi') || dishNames.includes('bibimbap') || dishNames.includes('bbq')) {
      categories.push('Korean');
    }
    if (dishNames.includes('chinese') || dishNames.includes('noodles') || dishNames.includes('fried rice') || dishNames.includes('manchurian')) {
      categories.push('Chinese');
    }
    if (dishNames.includes('dosa') || dishNames.includes('idli') || dishNames.includes('sambar') || dishNames.includes('vada')) {
      categories.push('South Indian');
    }
  }
  
  // If no categories found, add "Other"
  if (categories.length === 0) {
    categories.push('Other');
  }
  
  return categories;
}

// Utility to ensure latitude/longitude fields are present
export function normalizeVendor(vendor: any): Vendor & { latitude?: number; longitude?: number } {
  let normalizedVendor: any = { ...vendor };
  
  // Handle shortened field names from optimized API response
  if (vendor.n) normalizedVendor.name = vendor.n;
  if (vendor.c) normalizedVendor.contactNumber = vendor.c;
  if (vendor.m) normalizedVendor.mapsLink = vendor.m;
  if (vendor.o) normalizedVendor.operatingHours = vendor.o;
  if (vendor.f) normalizedVendor.foodType = vendor.f;
  if (vendor.lat) normalizedVendor.latitude = vendor.lat;
  if (vendor.lng) normalizedVendor.longitude = vendor.lng;
  if (vendor.id) normalizedVendor._id = vendor.id;
  
  // Ensure foodType is properly set and normalized
  if (!normalizedVendor.foodType || normalizedVendor.foodType === '') {
    normalizedVendor.foodType = 'none';
  } else {
    let ft = normalizedVendor.foodType.toLowerCase().trim();
    if (ft === 'nonveg') ft = 'non-veg';
    normalizedVendor.foodType = ft;
  }
  
  // Derive categories from vendor data
  normalizedVendor.category = deriveVendorCategories(vendor);
  
  // If latitude/longitude already present, return as is
  if (typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
    return normalizedVendor;
  }
  // If location.coordinates exists, map to lat/lng
  if (vendor.location && Array.isArray(vendor.location.coordinates) && vendor.location.coordinates.length === 2) {
    return {
      ...normalizedVendor,
      latitude: vendor.location.coordinates[1],
      longitude: vendor.location.coordinates[0],
    };
  }
  // Otherwise, return as is
  return normalizedVendor;
}

export default api; 