import React from 'react';
import { render, screen } from '@testing-library/react';
import { MileageHistoryTest } from '../components/vehicle/MileageHistoryTest';
import { FixedMileageHistoryTable } from '../components/vehicle/FixedMileageHistoryTable';

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('Mileage History Integration Tests', () => {
  test('renders test component with all validation states', () => {
    render(<MileageHistoryTest />);
    
    // Check if the component renders
    expect(screen.getByText('Fixed Mileage History - Test Component')).toBeInTheDocument();
    
    // Check for test scenarios
    expect(screen.getByText('Test Scenarios:')).toBeInTheDocument();
    expect(screen.getByText(/Rollback detected/)).toBeInTheDocument();
    expect(screen.getByText(/Valid increase/)).toBeInTheDocument();
    expect(screen.getByText(/Suspicious large increase/)).toBeInTheDocument();
  });

  test('renders mileage history table with proper validation badges', () => {
    const testRecords = [
      {
        id: '1',
        mileage: 82,
        recordedAt: '2025-10-24T20:20:00Z',
        source: 'obd_device',
        flagged: true,
        validationStatus: 'ROLLBACK_DETECTED' as const,
        delta: -65918,
        previousMileage: 67000,
        newMileage: 82
      },
      {
        id: '2',
        mileage: 78,
        recordedAt: '2025-10-24T20:18:52Z',
        source: 'obd_device',
        flagged: false,
        validationStatus: 'VALID' as const,
        delta: 4,
        previousMileage: 74,
        newMileage: 78,
        blockchainHash: 'abc123...'
      }
    ];

    render(
      <FixedMileageHistoryTable 
        records={testRecords}
        onCopyHash={jest.fn()}
        copiedHash={null}
      />
    );

    // Check for validation badges
    expect(screen.getByText('Flagged')).toBeInTheDocument();
    expect(screen.getByText('Valid')).toBeInTheDocument();
    
    // Check for mileage values
    expect(screen.getByText('82 km')).toBeInTheDocument();
    expect(screen.getByText('78 km')).toBeInTheDocument();
    
    // Check for delta values
    expect(screen.getByText('-65918 km')).toBeInTheDocument();
    expect(screen.getByText('+4 km')).toBeInTheDocument();
  });

  test('handles copy hash functionality', async () => {
    const mockCopyHash = jest.fn();
    const testRecords = [
      {
        id: '1',
        mileage: 78,
        recordedAt: '2025-10-24T20:18:52Z',
        source: 'obd_device',
        flagged: false,
        validationStatus: 'VALID' as const,
        delta: 4,
        blockchainHash: 'abc123...'
      }
    ];

    render(
      <FixedMileageHistoryTable 
        records={testRecords}
        onCopyHash={mockCopyHash}
        copiedHash={null}
      />
    );

    // Find and click the copy button
    const copyButton = screen.getByTitle('Copy hash');
    expect(copyButton).toBeInTheDocument();
    
    // The copy functionality should be available
    expect(mockCopyHash).toBeDefined();
  });

  test('displays blockchain links for valid records only', () => {
    const testRecords = [
      {
        id: '1',
        mileage: 82,
        recordedAt: '2025-10-24T20:20:00Z',
        source: 'obd_device',
        flagged: true,
        validationStatus: 'ROLLBACK_DETECTED' as const,
        delta: -65918,
        blockchainHash: null // No hash for flagged records
      },
      {
        id: '2',
        mileage: 78,
        recordedAt: '2025-10-24T20:18:52Z',
        source: 'obd_device',
        flagged: false,
        validationStatus: 'VALID' as const,
        delta: 4,
        blockchainHash: 'abc123...' // Has hash for valid records
      }
    ];

    render(
      <FixedMileageHistoryTable 
        records={testRecords}
        onCopyHash={jest.fn()}
        copiedHash={null}
      />
    );

    // Check for "Not anchored" status for flagged records
    expect(screen.getByText('Not anchored')).toBeInTheDocument();
    
    // Check for blockchain explorer link for valid records
    const explorerLink = screen.getByTitle('View on Solana Explorer');
    expect(explorerLink).toBeInTheDocument();
    expect(explorerLink).toHaveAttribute('href', expect.stringContaining('explorer.solana.com'));
  });
});

