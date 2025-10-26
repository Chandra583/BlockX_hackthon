import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RegisterVehicle from '../pages/Vehicles/RegisterVehicle';
import { VehicleService } from '../services/vehicle';
import { WalletService } from '../services/wallet';

// Mock services
jest.mock('../services/vehicle');
jest.mock('../services/wallet');
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock store
const mockStore = configureStore({
  reducer: {
    auth: (state = { user: { id: '1', role: 'owner' } }, action) => state,
  },
});

// Mock fetch
global.fetch = jest.fn();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('RegisterVehicle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (WalletService.getAddress as jest.Mock).mockResolvedValue({
      address: '2HtTTil8RLjvXayNsMEnSqxVP2ZIGZKUhP9ZvHWNTzna'
    });
  });

  it('renders the form with all required fields', () => {
    renderWithProviders(<RegisterVehicle />);
    
    expect(screen.getByLabelText(/Vehicle Identification Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Vehicle Registration Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Make/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Mileage/i)).toBeInTheDocument();
  });

  it('validates required fields on submit', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    const submitButton = screen.getByRole('button', { name: /Register Vehicle/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/VIN must be exactly 17 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Vehicle number is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Make is required/i)).toBeInTheDocument();
    });
  });

  it('validates VIN format', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    const vinInput = screen.getByLabelText(/Vehicle Identification Number/i);
    fireEvent.change(vinInput, { target: { value: 'INVALID123456789' } });
    fireEvent.blur(vinInput);
    
    await waitFor(() => {
      expect(screen.getByText(/VIN contains invalid characters/i)).toBeInTheDocument();
    });
  });

  it('validates VIN length', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    const vinInput = screen.getByLabelText(/Vehicle Identification Number/i);
    fireEvent.change(vinInput, { target: { value: '1234567890123456' } });
    fireEvent.blur(vinInput);
    
    await waitFor(() => {
      expect(screen.getByText(/VIN must be exactly 17 characters/i)).toBeInTheDocument();
    });
  });

  it('validates mileage is not negative', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    const mileageInput = screen.getByLabelText(/Current Mileage/i);
    fireEvent.change(mileageInput, { target: { value: '-100' } });
    fireEvent.blur(mileageInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Mileage cannot be negative/i)).toBeInTheDocument();
    });
  });

  it('validates year range', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    const yearInput = screen.getByLabelText(/Year/i);
    fireEvent.change(yearInput, { target: { value: '1800' } });
    fireEvent.blur(yearInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Year must be 1900 or later/i)).toBeInTheDocument();
    });
  });

  it('auto-fills wallet address', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    await waitFor(() => {
      const walletInput = screen.getByDisplayValue('2HtTTil8RLjvXayNsMEnSqxVP2ZIGZKUhP9ZvHWNTzna');
      expect(walletInput).toBeInTheDocument();
    });
  });

  it('shows preview modal when preview button is clicked', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    // Fill in some form data
    fireEvent.change(screen.getByLabelText(/Vehicle Identification Number/i), {
      target: { value: '1HGCM82633A123456' }
    });
    fireEvent.change(screen.getByLabelText(/Make/i), {
      target: { value: 'Honda' }
    });
    
    const previewButton = screen.getByRole('button', { name: /Preview/i });
    fireEvent.click(previewButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Vehicle Registration Preview/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation modal on valid form submission', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    // Fill in all required fields
    fireEvent.change(screen.getByLabelText(/Vehicle Identification Number/i), {
      target: { value: '1HGCM82633A123456' }
    });
    fireEvent.change(screen.getByLabelText(/Vehicle Registration Number/i), {
      target: { value: 'ABC1234' }
    });
    fireEvent.change(screen.getByLabelText(/Make/i), {
      target: { value: 'Honda' }
    });
    fireEvent.change(screen.getByLabelText(/Model/i), {
      target: { value: 'Civic' }
    });
    fireEvent.change(screen.getByLabelText(/Year/i), {
      target: { value: '2023' }
    });
    fireEvent.change(screen.getByLabelText(/Current Mileage/i), {
      target: { value: '15000' }
    });
    
    const submitButton = screen.getByRole('button', { name: /Register Vehicle/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Confirm Registration/i)).toBeInTheDocument();
    });
  });

  it('handles file upload', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/Select Photos/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  it('validates file size for photos', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    // Create a large file (6MB)
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText(/Select Photos/i);
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File large.jpg is too large/i)).toBeInTheDocument();
    });
  });

  it('validates file type for photos', async () => {
    renderWithProviders(<RegisterVehicle />);
    
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/Select Photos/i);
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    
    await waitFor(() => {
      expect(screen.getByText(/File test.txt has invalid type/i)).toBeInTheDocument();
    });
  });

  it('shows draft management when draft exists', async () => {
    // Mock localStorage
    const mockDraft = {
      vin: '1HGCM82633A123456',
      make: 'Honda',
      model: 'Civic'
    };
    localStorage.setItem('vehicle-registration-draft', JSON.stringify(mockDraft));
    
    renderWithProviders(<RegisterVehicle />);
    
    await waitFor(() => {
      expect(screen.getByText(/Draft saved automatically/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Restore Draft/i })).toBeInTheDocument();
    });
    
    // Cleanup
    localStorage.removeItem('vehicle-registration-draft');
  });

  it('restores draft when restore button is clicked', async () => {
    const mockDraft = {
      vin: '1HGCM82633A123456',
      make: 'Honda',
      model: 'Civic'
    };
    localStorage.setItem('vehicle-registration-draft', JSON.stringify(mockDraft));
    
    renderWithProviders(<RegisterVehicle />);
    
    const restoreButton = screen.getByRole('button', { name: /Restore Draft/i });
    fireEvent.click(restoreButton);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('1HGCM82633A123456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Honda')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Civic')).toBeInTheDocument();
    });
    
    // Cleanup
    localStorage.removeItem('vehicle-registration-draft');
  });

  it('discards draft when discard button is clicked', async () => {
    const mockDraft = {
      vin: '1HGCM82633A123456',
      make: 'Honda',
      model: 'Civic'
    };
    localStorage.setItem('vehicle-registration-draft', JSON.stringify(mockDraft));
    
    renderWithProviders(<RegisterVehicle />);
    
    const discardButton = screen.getByRole('button', { name: /Discard/i });
    fireEvent.click(discardButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/Draft saved automatically/i)).not.toBeInTheDocument();
    });
  });
});
