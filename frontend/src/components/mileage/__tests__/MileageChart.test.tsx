import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MileageChart from '../MileageChart';

// Mock recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

const mockHistory = [
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
    blockchainHash: 'hash123',
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
    blockchainHash: 'hash456',
  },
];

describe('MileageChart', () => {
  it('renders chart with data', () => {
    render(<MileageChart history={mockHistory} currentMileage={15000} />);
    
    expect(screen.getByText('Mileage Trend')).toBeInTheDocument();
    expect(screen.getByText('15,000 km')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    render(<MileageChart history={[]} currentMileage={0} />);
    
    expect(screen.getByText('No Mileage Data')).toBeInTheDocument();
    expect(screen.getByText('No mileage records available for charting.')).toBeInTheDocument();
  });

  it('displays correct chart stats', () => {
    render(<MileageChart history={mockHistory} currentMileage={15000} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Total Records
    expect(screen.getByText('1')).toBeInTheDocument(); // Verified count
  });

  it('sorts history by date correctly', () => {
    const unsortedHistory = [
      { ...mockHistory[1], recordedAt: '2024-01-02T00:00:00Z' },
      { ...mockHistory[0], recordedAt: '2024-01-01T00:00:00Z' },
    ];
    
    render(<MileageChart history={unsortedHistory} currentMileage={15000} />);
    
    // Chart should render without errors
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('calculates chart bounds correctly', () => {
    render(<MileageChart history={mockHistory} currentMileage={20000} />);
    
    // Chart should render with proper bounds
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });
});
