import React, { useEffect, useState } from 'react';
import AdminService from '../../services/admin';

const statusColors: Record<string, string> = {
  requested: 'bg-gray-100 text-gray-700',
  assigned: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-200 text-gray-700',
};

export default function InstallJobsPage(): JSX.Element {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ deviceId: '', ownerId: '', providerId: '', notes: '' });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await AdminService.getInstallJobs({ page: 1, limit: 10 });
      setJobs(data.jobs || []);
      setError(null);
    } catch (err) {
      setError('Failed to load install jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await AdminService.createInstallJob({
        deviceId: form.deviceId,
        ownerId: form.ownerId,
        assignedProviderId: form.providerId || undefined,
        notes: form.notes || undefined,
      });
      setForm({ deviceId: '', ownerId: '', providerId: '', notes: '' });
      loadJobs();
    } catch (err) {
      setError('Failed to create install job');
    }
  };

  const handleAssign = async (jobId: string, providerId: string) => {
    if (!providerId) return;
    try {
      await AdminService.assignInstallJob(jobId, providerId);
      loadJobs();
    } catch (err) {
      setError('Failed to assign provider');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create Install Job</h2>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleCreate}>
          <input className="input" placeholder="Device ID (ObjectId)" value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: e.target.value })} />
          <input className="input" placeholder="Owner ID (ObjectId)" value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })} />
          <input className="input" placeholder="Provider ID (ObjectId)" value={form.providerId} onChange={(e) => setForm({ ...form, providerId: e.target.value })} />
          <input className="input" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="md:col-span-4">
            <button type="submit" className="btn-primary">Create Job</button>
          </div>
        </form>
        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Install Jobs</h2>
        </div>
        {loading ? (
          <div className="p-6 text-gray-600">Loading...</div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="p-2">Job ID</th>
                  <th className="p-2">Device</th>
                  <th className="p-2">Owner</th>
                  <th className="p-2">Provider</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id} className="border-t">
                    <td className="p-2 font-mono text-xs">{job._id}</td>
                    <td className="p-2">{job.deviceId?.deviceID || job.deviceId}</td>
                    <td className="p-2">{job.ownerId?.email || job.ownerId}</td>
                    <td className="p-2">{job.assignedProviderId?.email || '—'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || 'bg-gray-100 text-gray-700'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex items-center space-x-2">
                        <input className="input" placeholder="Provider ID" onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const providerId = (e.target as HTMLInputElement).value;
                            handleAssign(job._id, providerId);
                          }
                        }} />
                        <button className="btn-secondary" onClick={() => {
                          const providerId = prompt('Enter Provider ID');
                          if (providerId) handleAssign(job._id, providerId);
                        }}>Assign</button>
                      </div>
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


