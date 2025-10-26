import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VehicleCard } from '../components/vehicle/VehicleCard';

// Mock the TrustScoreCard component
jest.mock('../components/TrustScore/TrustScoreCard', () => ({
  TrustScoreCard: ({ score, vehicleId, compact }: any) => (
    <div data-testid="trust-score-card" data-score={score} data-vehicle-id={vehicleId} data-compact={compact}>
      Trust Score: {score}
    </div>
  )
}));

const mockVehicle = {
  id: 'vehicle-1',
  vin: '1HGCM82633A123456',
  vehicleNumber: 'KA09JS1221',
  make: 'Honda',
  model: 'Civic',
  year: 2023,
  color: 'White',
  currentMileage: 15000,
  trustScore: 85,
  verificationStatus: 'verified',
  isForSale: false,
  createdAt: '2023-01-01T00:00:00Z',
  lastOBDUpdate: '2023-12-01T10:00:00Z',
  deviceId: 'OBD30233',
  blockchainTx: 'tx123456789',
  fraudAlerts: 0
};

const mockInstallationRequest = {
  status: 'completed',
  deviceId: 'OBD30233'
};

const defaultProps = {
  vehicle: mockVehicle,
  installationRequest: mockInstallationRequest,
  onViewDetails: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onGenerateReport: jest.fn(),
  onListMarketplace: jest.fn(),
  onUpdateMileage: jest.fn()
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('VehicleCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders vehicle information correctly', () => {
    renderWithRouter(<VehicleCard {...defaultProps} />);
    
    expect(screen.getByText('2023 Honda Civic')).toBeInTheDocument();
    expect(screen.getByText('1HGCM82633A123456')).toBeInTheDocument();
    expect(screen.getByText('KA09JS1221')).toBeInTheDocument();
    expect(screen.getByText('15,000 km')).toBeInTheDocument();
  });

  it('displays trust score correctly', () => {
    renderWithRouter(<VehicleCard {...defaultProps} />);
    
    const trustScoreCard = screen.getByTestId('trust-score-card');
    expect(trustScoreCard).toBeInTheDocument();
    expect(trustScoreCard).toHaveAttribute('data-score', '85');
    expect(trustScoreCard).toHaveAttribute('data-vehicle-id', 'vehicle-1');
    expect(trustScoreCard).toHaveAttribute('data-compact', 'true');
  });

  it('shows status badges correctly', () => {
    renderWithRouter(<VehicleCard {...defaultProps} />);
    
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Installed')).toBeInTheDocument();
  });

  it('shows flagged badge when fraud alerts exist', () => {
    const vehicleWithFraud = {
      ...mockVehicle,
      fraudAlerts: 2
    };
    
    renderWithRouter(<VehicleCard {...defaultProps} vehicle={vehicleWithFraud} />);
    
    expect(screen.getByText('Flagged')).toBeInTheDocument();
  });

  it('displays device information', () => {
    renderWithRouter(<VehicleCard {...defaultProps} />);
    
    expect(screen.getByText('Device: OBD30233')).toBeInTheDocument();
    expect(screen.getByText('Anchored to blockchain')).toBeInTheDocument();
  });

  it('handles click events correctly', async () => {
    renderWithRouter(<VehicleCard {...defaultProps} />);
    
    // Test View Details button
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);
    expect(defaultProps.onViewDetails).toHaveBeenCalledWith('vehicle-1');
    
    // Test Update button
    const updateButton = screen.getByText('Update');
    fireEvent.click(updateButton);
    expect(defaultProps.onUpdateMileage).toHaveBeenCalledWith('vehicle-1');
  });

  it('handles action button clicks', async () => {
    renderWithRouter(<VehicleCard {...defaultProps} />);
    
    // Test action buttons
    const reportButton = screen.getByTitle('Generate Report');
    fireEvent.click(reportButton);
    expect(defaultProps.onGenerateReport).toHaveBeenCalledWith('vehicle-1');
    
    const marketplaceButton = screen.getByTitle('List on Marketplace');
    fireEvent.click(marketplaceButton);
    expect(defaultProps.onListMarketplace).toHaveBeenCalledWith('vehicle-1');
    
    const editButton = screen.getByTitle('Edit Vehicle');
    fireEvent.click(editButton);
    expect(defaultProps.onEdit).toHaveBeenCalledWith('vehicle-1');
    
    const deleteButton = screen.getByTitle('Delete Vehicle');
    fireEvent.click(deleteButton);
    expect(defaultProps.onDelete).toHaveBeenCalledWith('vehicle-1');
  });

  it('formats last update time correctly', () => {
    renderWithRouter(<VehicleCard {...defaultProps} />);
    
    // Should show relative time
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it('handles missing installation request', () => {
    renderWithRouter(<VehicleCard {...defaultProps} installationRequest={undefined} />);
    
    // Should not show device status
    expect(screen.queryByText('Installed')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(
      <VehicleCard {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows different status for pending verification', () => {
    const pendingVehicle = {
      ...mockVehicle,
      verificationStatus: 'pending'
    };
    
    renderWithRouter(<VehicleCard {...defaultProps} vehicle={pendingVehicle} />);
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows different status for assigned device', () => {
    const assignedRequest = {
      status: 'assigned',
      deviceId: 'OBD30233'
    };
    
    renderWithRouter(<VehicleCard {...defaultProps} installationRequest={assignedRequest} />);
    
    expect(screen.getByText('Assigned')).toBeInTheDocument();
  });
});
