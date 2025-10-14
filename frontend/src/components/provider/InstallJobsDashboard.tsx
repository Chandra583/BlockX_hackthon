import React, { useEffect, useState } from 'react';
import ProviderService from '../../services/provider';

export default function InstallJobsDashboard(): JSX.Element {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await ProviderService.getMyInstallJobs({ page: 1, limit: 20 });
      setJobs(data.jobs || []);
      setError(null);
    } catch (err) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const accept = async (id: string) => { await ProviderService.acceptJob(id); load(); };
  const decline = async (id: string) => { await ProviderService.declineJob(id); load(); };
  const mark = async (id: string, status: 'in_progress' | 'completed' | 'cancelled') => { await ProviderService.updateJobStatus(id, status); load(); };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">My Install Jobs</h1>
        <p className="text-gray-600">Accept/decline assignments and update progress.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Assigned Jobs</h2>
        </div>
        {loading ? (
          <div className="p-6 text-gray-600">Loading...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Job</th>
                  <th className="p-2">Device</th>
                  <th className="p-2">Owner</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j._id} className="border-t">
                    <td className="p-2 font-mono text-xs">{j._id}</td>
                    <td className="p-2">{j.deviceId?.deviceID || j.deviceId}</td>
                    <td className="p-2">{j.ownerId?.email || j.ownerId}</td>
                    <td className="p-2"><span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">{j.status}</span></td>
                    <td className="p-2 space-x-2">
                      {j.status === 'assigned' && (
                        <>
                          <button className="btn-primary" onClick={() => accept(j._id)}>Accept</button>
                          <button className="btn-secondary" onClick={() => decline(j._id)}>Decline</button>
                        </>
                      )}
                      {j.status === 'accepted' && (
                        <button className="btn-secondary" onClick={() => mark(j._id, 'in_progress')}>Start</button>
                      )}
                      {j.status === 'in_progress' && (
                        <>
                          <button className="btn-primary" onClick={() => mark(j._id, 'completed')}>Complete</button>
                          <button className="btn-secondary" onClick={() => mark(j._id, 'cancelled')}>Cancel</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


