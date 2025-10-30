import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/button';
import VehicleAPI from '../../api/vehicle';
import Input from '../ui/Input';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported?: (vehicleId: string) => void;
}

export const ImportVehicleModal: React.FC<Props> = ({ open, onClose, onImported }) => {
  const [vin, setVin] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = !!vin || !!regNumber || !!deviceId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await VehicleAPI.importVehicle({ vin: vin || undefined, regNumber: regNumber || undefined, deviceId: deviceId || undefined });
      if (resp.success) {
        onImported?.(resp.data?.vehicleId || '');
        onClose();
      } else {
        setError(resp.message || 'Import failed');
      }
    } catch (e: any) {
      setError(e?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const vinHelp = 'VIN must be 17 characters (A-HJ-NPR-Z0-9).';

  return (
    <Modal isOpen={open} onClose={onClose} title="Import Vehicle" theme="dark">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-slate-400">Provide any one identifier. We will locate and attach the vehicle to your account.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-200">VIN</label>
            <Input placeholder="1HGCM82633A123456" value={vin} onChange={(e: any) => setVin(e.target.value.toUpperCase())} maxLength={17} />
            <div className="text-xs text-slate-500 mt-1">{vinHelp}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200">Registration Number</label>
            <Input placeholder="KA09JS1221" value={regNumber} onChange={(e: any) => setRegNumber(e.target.value.toUpperCase())} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-200">Device ID (OBD)</label>
            <Input placeholder="OBD30233" value={deviceId} onChange={(e: any) => setDeviceId(e.target.value)} />
            <div className="text-xs text-slate-500 mt-1">If your OBD device is already linked, we can detect the vehicle automatically.</div>
          </div>
        </div>
        {error && <div className="text-xs text-red-400">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600 border border-slate-600" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!canSubmit || loading} className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500">{loading ? 'Importing...' : 'Import Vehicle'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ImportVehicleModal;


