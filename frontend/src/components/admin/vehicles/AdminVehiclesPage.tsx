import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Search, AlertCircle } from 'lucide-react';
import AdminService from '../../../services/admin';

const AdminVehiclesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [page, setPage] = useState<number>(parseInt(searchParams.get('page') || '1', 10));
  const [limit] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);
  const status = (searchParams.get('status') || 'pending') as 'pending' | 'verified' | 'rejected';
  const [search, setSearch] = useState<string>(searchParams.get('search') || '');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await AdminService.getAllVehicles({ status, page, limit, search });
      setVehicles(res.data.vehicles || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (e) {
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const handleApprove = async (vehicleId: string) => {
    try {
      setLoading(true);
      await AdminService.approveVehicle(vehicleId);
      await fetchData();
    } catch (e) {
      setError('Approval failed');
      setLoading(false);
    }
  };

  const handleReject = async (vehicleId: string) => {
    const reason = prompt('Enter rejection reason');
    if (!reason) return;
    try {
      setLoading(true);
      await AdminService.rejectVehicle(vehicleId, reason);
      await fetchData();
    } catch (e) {
      setError('Rejection failed');
      setLoading(false);
    }
  };

  const updateQuery = (next: Record<string, string>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([k, v]) => updated.set(k, v));
    setSearchParams(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Vehicles</h1>
        <div className="flex gap-2">
          {(['pending','verified','rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { updateQuery({ status: s, page: '1' }); setPage(1); }}
              className={`px-3 py-1 rounded-full text-sm border ${status===s ? 'bg-gray-900 text-white' : 'bg-white text-gray-700'}`}
            >
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center bg-white border rounded-lg p-3">
        <Search className="w-4 h-4 text-gray-500 mr-2" />
        <input
          className="flex-1 outline-none"
          placeholder="Search by VIN, number, make, model"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key==='Enter') { updateQuery({ search, page: '1' }); setPage(1); fetchData(); } }}
        />
        <button className="btn-secondary ml-2" onClick={() => { updateQuery({ search, page: '1' }); setPage(1); fetchData(); }}>Search</button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">VIN</th>
                <th className="px-4 py-2 text-left">Number</th>
                <th className="px-4 py-2 text-left">Vehicle</th>
                <th className="px-4 py-2 text-left">Owner</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v._id} className="border-t">
                  <td className="px-4 py-2 font-mono">{v.vin}</td>
                  <td className="px-4 py-2">{v.vehicleNumber}</td>
                  <td className="px-4 py-2">{v.year} {v.make} {v.vehicleModel}</td>
                  <td className="px-4 py-2">{v.ownerId?.firstName} {v.ownerId?.lastName}</td>
                  <td className="px-4 py-2 capitalize">{v.verificationStatus}</td>
                  <td className="px-4 py-2 text-right">
                    {v.verificationStatus === 'pending' ? (
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleApprove(v._id)} className="btn-primary inline-flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </button>
                        <button onClick={() => handleReject(v._id)} className="btn-danger inline-flex items-center">
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No vehicles found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button disabled={page<=1} onClick={() => { setPage(page-1); updateQuery({ page: String(page-1) }); }} className="btn-secondary disabled:opacity-50">Previous</button>
        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
        <button disabled={page>=totalPages} onClick={() => { setPage(page+1); updateQuery({ page: String(page+1) }); }} className="btn-secondary disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default AdminVehiclesPage;



