import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { 
  Vehicle, 
  VehicleRegistrationFormData, 
  VehicleSearchQuery,
  MileageUpdateFormData,
  VehicleDocument,
  VINValidationResult
} from '../../types/vehicle';

// Vehicle State Interface
export interface VehicleState {
  // Vehicle Data
  vehicles: Vehicle[];
  currentVehicle: Vehicle | null;
  userVehicles: Vehicle[];
  
  // Search & Filters
  searchQuery: VehicleSearchQuery;
  searchResults: Vehicle[];
  totalVehicles: number;
  
  // Documents
  vehicleDocuments: Record<string, VehicleDocument[]>; // vehicleId -> documents
  
  // UI State
  isLoading: boolean;
  isRegistering: boolean;
  isUpdatingMileage: boolean;
  isUploadingDocument: boolean;
  isValidatingVIN: boolean;
  
  // Error State
  error: string | null;
  registrationError: string | null;
  mileageError: string | null;
  documentError: string | null;
  vinError: string | null;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  
  // VIN Validation
  vinValidationResult: VINValidationResult | null;
  
  // Success Messages
  successMessage: string | null;
}

// Initial State
const initialState: VehicleState = {
  // Vehicle Data
  vehicles: [],
  currentVehicle: null,
  userVehicles: [],
  
  // Search & Filters
  searchQuery: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  searchResults: [],
  totalVehicles: 0,
  
  // Documents
  vehicleDocuments: {},
  
  // UI State
  isLoading: false,
  isRegistering: false,
  isUpdatingMileage: false,
  isUploadingDocument: false,
  isValidatingVIN: false,
  
  // Error State
  error: null,
  registrationError: null,
  mileageError: null,
  documentError: null,
  vinError: null,
  
  // Pagination
  currentPage: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
  
  // VIN Validation
  vinValidationResult: null,
  
  // Success Messages
  successMessage: null,
};

// Async Thunks
export const registerVehicle = createAsyncThunk(
  'vehicle/registerVehicle',
  async (vehicleData: VehicleRegistrationFormData, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/vehicles/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Vehicle registration failed');
      }

      const data = await response.json();
      return data.data.vehicle;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error occurred');
    }
  }
);

export const fetchUserVehicles = createAsyncThunk(
  'vehicle/fetchUserVehicles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/vehicles/my-vehicles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch vehicles');
      }

      const data = await response.json();
      return data.data.vehicles;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Network error occurred');
    }
  }
);

export const searchVehicles = createAsyncThunk(
  'vehicle/searchVehicles',
  async (query: VehicleSearchQuery, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      
      // Add query parameters
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/vehicles/search?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Search failed');
      }

      const data = await response.json();
      return {
        vehicles: data.data.vehicles,
        pagination: data.data.pagination,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const updateVehicleMileage = createAsyncThunk(
  'vehicle/updateMileage',
  async ({ vehicleId, mileageData }: { vehicleId: string; mileageData: MileageUpdateFormData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/mileage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(mileageData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Mileage update failed');
      }

      const data = await response.json();
      return {
        vehicleId,
        newMileage: data.data.newMileage,
        trustScore: data.data.trustScore,
        message: data.message,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const validateVIN = createAsyncThunk(
  'vehicle/validateVIN',
  async (vin: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/vehicles/validate-vin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ vin }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'VIN validation failed');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const uploadVehicleDocument = createAsyncThunk(
  'vehicle/uploadDocument',
  async ({ vehicleId, documentData }: { vehicleId: string; documentData: FormData }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: documentData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Document upload failed');
      }

      const data = await response.json();
      return {
        vehicleId,
        document: data.data.document,
        message: data.message,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

export const fetchVehicleDocuments = createAsyncThunk(
  'vehicle/fetchDocuments',
  async (vehicleId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}/documents`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.message || 'Failed to fetch documents');
      }

      const data = await response.json();
      return {
        vehicleId,
        documents: data.data.documents,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Network error occurred');
    }
  }
);

// Vehicle Slice
const vehicleSlice = createSlice({
  name: 'vehicle',
  initialState,
  reducers: {
    // Clear Error Messages
    clearError: (state) => {
      state.error = null;
      state.registrationError = null;
      state.mileageError = null;
      state.documentError = null;
      state.vinError = null;
    },
    
    // Clear Success Messages
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    
    // Set Current Vehicle
    setCurrentVehicle: (state, action: PayloadAction<Vehicle | null>) => {
      state.currentVehicle = action.payload;
    },
    
    // Update Search Query
    updateSearchQuery: (state, action: PayloadAction<Partial<VehicleSearchQuery>>) => {
      state.searchQuery = { ...state.searchQuery, ...action.payload };
    },
    
    // Reset Search
    resetSearch: (state) => {
      state.searchQuery = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      state.searchResults = [];
      state.totalVehicles = 0;
      state.currentPage = 1;
      state.totalPages = 1;
      state.hasNextPage = false;
      state.hasPreviousPage = false;
    },
    
    // Clear VIN Validation
    clearVINValidation: (state) => {
      state.vinValidationResult = null;
      state.vinError = null;
    },
    
    // Update Vehicle in Lists
    updateVehicleInLists: (state, action: PayloadAction<Vehicle>) => {
      const updatedVehicle = action.payload;
      
      // Update in vehicles list
      const vehicleIndex = state.vehicles.findIndex(v => v.id === updatedVehicle.id);
      if (vehicleIndex !== -1) {
        state.vehicles[vehicleIndex] = updatedVehicle;
      }
      
      // Update in user vehicles list
      const userVehicleIndex = state.userVehicles.findIndex(v => v.id === updatedVehicle.id);
      if (userVehicleIndex !== -1) {
        state.userVehicles[userVehicleIndex] = updatedVehicle;
      }
      
      // Update in search results
      const searchResultIndex = state.searchResults.findIndex(v => v.id === updatedVehicle.id);
      if (searchResultIndex !== -1) {
        state.searchResults[searchResultIndex] = updatedVehicle;
      }
      
      // Update current vehicle if it matches
      if (state.currentVehicle?.id === updatedVehicle.id) {
        state.currentVehicle = updatedVehicle;
      }
    },
    
    // Remove Vehicle from Lists
    removeVehicleFromLists: (state, action: PayloadAction<string>) => {
      const vehicleId = action.payload;
      
      state.vehicles = state.vehicles.filter(v => v.id !== vehicleId);
      state.userVehicles = state.userVehicles.filter(v => v.id !== vehicleId);
      state.searchResults = state.searchResults.filter(v => v.id !== vehicleId);
      
      if (state.currentVehicle?.id === vehicleId) {
        state.currentVehicle = null;
      }
      
      // Remove documents for this vehicle
      delete state.vehicleDocuments[vehicleId];
    },
  },
  extraReducers: (builder) => {
    // Register Vehicle
    builder
      .addCase(registerVehicle.pending, (state) => {
        state.isRegistering = true;
        state.registrationError = null;
        state.successMessage = null;
      })
      .addCase(registerVehicle.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.userVehicles.push(action.payload);
        state.vehicles.push(action.payload);
        state.successMessage = 'Vehicle registered successfully!';
      })
      .addCase(registerVehicle.rejected, (state, action) => {
        state.isRegistering = false;
        state.registrationError = action.payload as string;
      });

    // Fetch User Vehicles
    builder
      .addCase(fetchUserVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userVehicles = action.payload;
      })
      .addCase(fetchUserVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Search Vehicles
    builder
      .addCase(searchVehicles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchVehicles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.vehicles;
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.pages;
        state.totalVehicles = action.payload.pagination.total;
        state.hasNextPage = action.payload.pagination.hasNext;
        state.hasPreviousPage = action.payload.pagination.hasPrev;
      })
      .addCase(searchVehicles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update Mileage
    builder
      .addCase(updateVehicleMileage.pending, (state) => {
        state.isUpdatingMileage = true;
        state.mileageError = null;
        state.successMessage = null;
      })
      .addCase(updateVehicleMileage.fulfilled, (state, action) => {
        state.isUpdatingMileage = false;
        state.successMessage = action.payload.message;
        
        // Update mileage in all vehicle lists
        const { vehicleId, newMileage, trustScore } = action.payload;
        const updateVehicleMileage = (vehicle: Vehicle) => {
          if (vehicle.id === vehicleId) {
            vehicle.currentMileage = newMileage;
            if (trustScore !== undefined) {
              vehicle.trustScore = trustScore;
            }
            vehicle.lastMileageUpdate = new Date().toISOString();
          }
        };
        
        state.vehicles.forEach(updateVehicleMileage);
        state.userVehicles.forEach(updateVehicleMileage);
        state.searchResults.forEach(updateVehicleMileage);
        
        if (state.currentVehicle?.id === vehicleId) {
          state.currentVehicle.currentMileage = newMileage;
          if (trustScore !== undefined) {
            state.currentVehicle.trustScore = trustScore;
          }
          state.currentVehicle.lastMileageUpdate = new Date().toISOString();
        }
      })
      .addCase(updateVehicleMileage.rejected, (state, action) => {
        state.isUpdatingMileage = false;
        state.mileageError = action.payload as string;
      });

    // Validate VIN
    builder
      .addCase(validateVIN.pending, (state) => {
        state.isValidatingVIN = true;
        state.vinError = null;
        state.vinValidationResult = null;
      })
      .addCase(validateVIN.fulfilled, (state, action) => {
        state.isValidatingVIN = false;
        state.vinValidationResult = action.payload;
      })
      .addCase(validateVIN.rejected, (state, action) => {
        state.isValidatingVIN = false;
        state.vinError = action.payload as string;
      });

    // Upload Document
    builder
      .addCase(uploadVehicleDocument.pending, (state) => {
        state.isUploadingDocument = true;
        state.documentError = null;
        state.successMessage = null;
      })
      .addCase(uploadVehicleDocument.fulfilled, (state, action) => {
        state.isUploadingDocument = false;
        state.successMessage = action.payload.message;
        
        const { vehicleId, document } = action.payload;
        if (!state.vehicleDocuments[vehicleId]) {
          state.vehicleDocuments[vehicleId] = [];
        }
        state.vehicleDocuments[vehicleId].push(document);
      })
      .addCase(uploadVehicleDocument.rejected, (state, action) => {
        state.isUploadingDocument = false;
        state.documentError = action.payload as string;
      });

    // Fetch Documents
    builder
      .addCase(fetchVehicleDocuments.pending, (state) => {
        state.isLoading = true;
        state.documentError = null;
      })
      .addCase(fetchVehicleDocuments.fulfilled, (state, action) => {
        state.isLoading = false;
        const { vehicleId, documents } = action.payload;
        state.vehicleDocuments[vehicleId] = documents;
      })
      .addCase(fetchVehicleDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.documentError = action.payload as string;
      });
  },
});

// Export Actions
export const {
  clearError,
  clearSuccessMessage,
  setCurrentVehicle,
  updateSearchQuery,
  resetSearch,
  clearVINValidation,
  updateVehicleInLists,
  removeVehicleFromLists,
} = vehicleSlice.actions;

// Export Reducer
export default vehicleSlice.reducer; 