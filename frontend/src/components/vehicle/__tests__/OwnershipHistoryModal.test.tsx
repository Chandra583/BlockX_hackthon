import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OwnershipHistoryModal } from '../../vehicle/OwnershipHistoryModal';
import VehicleAPI from '../../../api/vehicle';

jest.mock('../../../api/vehicle');

describe('OwnershipHistoryModal', () => {
  it('renders empty state when no entries', async () => {
    (VehicleAPI.getOwnershipHistory as jest.Mock).mockResolvedValue({ success: true, data: [] });
    render(<OwnershipHistoryModal vehicleId="veh1" open={true} onClose={() => {}} />);

    await waitFor(() => expect(screen.getByText(/No ownership history available/i)).toBeInTheDocument());
  });
});


