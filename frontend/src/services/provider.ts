import apiService from './api';

export default class ProviderService {
  static async getMyInstallJobs(params?: { page?: number; limit?: number }) {
    const response = await apiService.get('/users/install-jobs', { params });
    return response.data.data;
  }

  static async acceptJob(jobId: string) {
    const response = await apiService.post(`/users/install-jobs/${jobId}/accept`);
    return response.data.data.job;
  }

  static async declineJob(jobId: string) {
    const response = await apiService.post(`/users/install-jobs/${jobId}/decline`);
    return response.data.data.job;
  }

  static async updateJobStatus(jobId: string, status: 'in_progress' | 'completed' | 'cancelled') {
    const response = await apiService.patch(`/users/install-jobs/${jobId}/status`, { status });
    return response.data.data.job;
  }
}


