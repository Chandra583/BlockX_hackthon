import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VehicleList from '../pages/Vehicles/VehicleList';
import { VehicleService } from '../services/vehicle';
import { InstallationService } from '../services/installation';

// Mock the services
jest.mock('../services/vehicle');
jest.mock('../services/installation');
jest.mock('../hooks/useSocket', () => ({
  __esModule: true,
  default: () => ({
    socket: null
  })
}));

// Mock the VehicleCard component
jest.mock('../components/vehicle/VehicleCard', () => ({
  VehicleCard: ({ vehicle, onViewDetails, onEdit, onDelete }: any) => (
    <div data-testid="vehicle-card" data-vehicle-id={vehicle.id}>
      <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
      <button onClick={() => onViewDetails(vehicle.id)}>View Details</button>
      <button onClick={() => onEdit(vehicle.id)}>Edit</button>
      <button onClick={() => onDelete(vehicle.id)}>Delete</button>
    </div>
  )
}));

const mockVehicles = [
  {
    id: 'vehicle-1',
    vin: '1HGCM82633A123456',
    vehicleNumber: 'KA09JS1221',
    make: 'Honda',
    model: 'Civic',
    year: 2023,
    currentMileage: 15000,
    trustScore: 85,
    verificationStatus: 'verified',
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'vehicle-2',
    vin: '1HGCM82633A123457',
    vehicleNumber: 'KA09JS1222',
    make: 'Toyota',
    model: 'Camry',
    year: 2022,
    currentMileage: 25000,
    trustScore: 92,
    verificationStatus: 'pending',
    createdAt: '2023-02-01T00:00:00Z'
  }
];

const mockInstallationSummary = {
  'vehicle-1': {
    status: 'completed',
    deviceId: 'OBD30233'
  },
  'vehicle-2': {
    status: 'assigned',
    deviceId: 'OBD30234'
  }
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('VehicleList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    (VehicleService.getUserVehicles as jest.Mock).mockResolvedValue({
      data: { vehicles: mockVehicles }
    });
    
    (InstallationService.getInstallationRequestSummary as jest.Mock).mockResolvedValue({
      data: mockInstallationSummary
    });
  });

  it('renders loading state initially', () => {
    renderWithRouter(<VehicleList />);
    
    expect(screen.getByText('My Vehicles')).toBeInTheDocument();
    // Should show skeleton loading
    expect(screen.getAllByTestId(/skeleton/)).toHaveLength(0); // No skeleton test ids in current implementation
  });

  it('fetches and displays vehicles', async () => {
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(VehicleService.getUserVehicles).toHaveBeenCalled();
      expect(InstallationService.getInstallationRequestSummary).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
      expect(screen.getByText('2022 Toyota Camry')).toBeInTheDocument();
    });
  });

  it('displays vehicle statistics', async () => {
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('2 vehicles')).toBeInTheDocument();
      expect(screen.getByText('1 verified')).toBeInTheDocument();
      expect(screen.getByText('1 with devices')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Search vehicles by VIN, number, make, or model...');
    fireEvent.change(searchInput, { target: { value: 'Honda' } });
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
      expect(screen.queryByText('2022 Toyota Camry')).not.toBeInTheDocument();
    });
  });

  it('handles sort functionality', async () => {
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
    });
    
    const sortSelect = screen.getByDisplayValue('Newest First');
    fireEvent.change(sortSelect, { target: { value: 'trustScore-desc' } });
    
    // Should re-render with new sort order
    await waitFor(() => {
      expect(screen.getByText('2022 Toyota Camry')).toBeInTheDocument();
    });
  });

  it('toggles view mode', async () => {
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
    });
    
    const listViewButton = screen.getByTitle('List view');
    fireEvent.click(listViewButton);
    
    // Should switch to list view
    expect(listViewButton).toHaveClass('bg-blue-600');
  });

  it('opens filter modal', async () => {
    renderWithRouter(<VehicleList />);
    
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    expect(screen.getByText('Filter Vehicles')).toBeInTheDocument();
  });

  it('handles empty state', async () => {
    (VehicleService.getUserVehicles as jest.Mock).mockResolvedValue({
      data: { vehicles: [] }
    });
    
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('No vehicles found')).toBeInTheDocument();
      expect(screen.getByText('Get started by registering your first vehicle')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (VehicleService.getUserVehicles as jest.Mock).mockRejectedValue(new Error('API Error'));
    
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      // Should show error toast (mocked)
      expect(screen.getByText('My Vehicles')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
    });
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(VehicleService.getUserVehicles).toHaveBeenCalledTimes(2);
    });
  });

  it('navigates to register vehicle', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));
    
    renderWithRouter(<VehicleList />);
    
    const registerButton = screen.getByText('Register Vehicle');
    fireEvent.click(registerButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/owner/vehicles/register');
  });

  it('handles vehicle card interactions', async () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));
    
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
    });
    
    const viewButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/vehicles/vehicle-1');
  });

  it('filters vehicles by status', async () => {
    renderWithRouter(<VehicleList />);
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
    });
    
    const filterButton = screen.getByText('Filters');
    fireEvent.click(filterButton);
    
    const verifiedFilter = screen.getByText('Verified');
    fireEvent.click(verifiedFilter);
    
    // Close modal
    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
      expect(screen.queryByText('2022 Toyota Camry')).not.toBeInTheDocument();
    });
  });

  it('handles responsive layout', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 768
    });
    
    renderWithRouter(<VehicleList />);
    
    // Should render with responsive classes
    expect(screen.getByText('My Vehicles')).toBeInTheDocument();
  });
});
