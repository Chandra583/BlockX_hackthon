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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Vehicles</h1>
          <p className="text-gray-600">Manage verification workflow for submitted vehicles</p>
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          {(['pending','verified','rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { updateQuery({ status: s, page: '1' }); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${status===s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {s.charAt(0).toUpperCase()+s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center bg-white border rounded-lg p-3 shadow-sm">
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
        <div className="grid grid-cols-1 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-x-auto shadow-sm">
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
                <tr key={v._id} className="border-t hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs">{v.vin}</td>
                  <td className="px-4 py-2">{v.vehicleNumber}</td>
                  <td className="px-4 py-2">{v.year} {v.make} {v.vehicleModel}</td>
                  <td className="px-4 py-2">{v.ownerId?.firstName} {v.ownerId?.lastName}</td>
                  <td className="px-4 py-2 capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      v.verificationStatus==='verified' ? 'bg-green-100 text-green-700' :
                      v.verificationStatus==='rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {v.verificationStatus}
                    </span>
                  </td>
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
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <div className="flex flex-col items-center text-gray-500">
                      <Search className="w-6 h-6 mb-2" />
                      <p>No vehicles found</p>
                    </div>
                  </td>
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



