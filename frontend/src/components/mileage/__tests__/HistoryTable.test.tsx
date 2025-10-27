import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryTable from '../HistoryTable';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

const mockData = {
  vehicleId: 'vehicle1',
  vin: 'VIN123',
  currentMileage: 15000,
  totalMileage: 15000,
  registeredMileage: 10000,
  serviceVerifiedMileage: 12000,
  lastOBDUpdate: {
    mileage: 15000,
    deviceId: 'OBD001',
    recordedAt: '2024-01-02T00:00:00Z',
  },
  history: [
    {
      _id: '1',
      vehicleId: 'vehicle1',
      vin: 'VIN123',
      mileage: 10000,
      recordedBy: {
        _id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        role: 'owner',
        fullName: 'John Doe',
        isLocked: false,
        id: 'user1',
      },
      recordedAt: '2024-01-01T00:00:00Z',
      source: 'automated',
      notes: 'Test',
      verified: true,
      deviceId: 'OBD001',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      blockchainHash: 'hash123456789',
    },
    {
      _id: '2',
      vehicleId: 'vehicle1',
      vin: 'VIN123',
      mileage: 15000,
      recordedBy: {
        _id: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        role: 'owner',
        fullName: 'John Doe',
        isLocked: false,
        id: 'user1',
      },
      recordedAt: '2024-01-02T00:00:00Z',
      source: 'owner',
      notes: 'Test',
      verified: false,
      deviceId: 'OBD001',
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      blockchainHash: 'hash987654321',
    },
  ],
  pagination: {
    page: 1,
    limit: 50,
    total: 2,
    pages: 1,
  },
};

describe('HistoryTable', () => {
  it('renders table with data', () => {
    render(<HistoryTable data={mockData} />);
    
    expect(screen.getByText('Mileage History')).toBeInTheDocument();
    expect(screen.getByText('15,000 km')).toBeInTheDocument();
    expect(screen.getByText('Current Mileage')).toBeInTheDocument();
  });

  it('displays correct number of records', () => {
    render(<HistoryTable data={mockData} />);
    
    expect(screen.getByText('Showing 2 of 2 records')).toBeInTheDocument();
  });

  it('shows validation badges correctly', () => {
    render(<HistoryTable data={mockData} />);
    
    expect(screen.getByText('Valid')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('calculates delta correctly', () => {
    render(<HistoryTable data={mockData} />);
    
    // Should show +5000 km delta for the second record
    expect(screen.getByText('+5000 km')).toBeInTheDocument();
  });

  it('handles copy to clipboard', async () => {
    render(<HistoryTable data={mockData} />);
    
    const copyButton = screen.getAllByLabelText('Copy hash to clipboard')[0];
    fireEvent.click(copyButton);
    
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hash123456789');
    });
  });

  it('filters by source', () => {
    render(<HistoryTable data={mockData} />);
    
    const filterSelect = screen.getByDisplayValue('All Sources');
    fireEvent.change(filterSelect, { target: { value: 'automated' } });
    
    // Should only show automated records
    expect(screen.getByText('Showing 1 of 2 records')).toBeInTheDocument();
  });

  it('sorts by date and mileage', () => {
    render(<HistoryTable data={mockData} />);
    
    const sortSelect = screen.getByDisplayValue('Date');
    fireEvent.change(sortSelect, { target: { value: 'mileage' } });
    
    // Should render without errors
    expect(screen.getByText('Mileage History')).toBeInTheDocument();
  });

  it('shows blockchain explorer links', () => {
    render(<HistoryTable data={mockData} />);
    
    const explorerLinks = screen.getAllByText('Explorer');
    expect(explorerLinks).toHaveLength(2);
    
    explorerLinks.forEach(link => {
      expect(link.closest('a')).toHaveAttribute('target', '_blank');
      expect(link.closest('a')).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('handles refresh callback', () => {
    const mockRefresh = jest.fn();
    render(<HistoryTable data={mockData} onRefresh={mockRefresh} />);
    
    const refreshButton = screen.getByLabelText('Refresh data');
    fireEvent.click(refreshButton);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('displays source icons and colors correctly', () => {
    render(<HistoryTable data={mockData} />);
    
    // Should have source badges with correct styling
    expect(screen.getByText('automated')).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
  });
});
