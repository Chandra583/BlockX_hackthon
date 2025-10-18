import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Search, Filter, Play, Check } from 'lucide-react';
import InstallStartModal from '../../components/SP/InstallStartModal';
import { ServiceInstallsService } from '../../services/serviceInstalls';

interface InstallAssignment {
  id: string;
  vehicleId: string;
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    lastVerifiedMileage?: number;
  };
  owner: {
    id: string;
    name: string;
    email: string;
  };
  status: 'requested' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'flagged';
  assignedAt: string;
  deviceId?: string;
  initialMileage?: number;
  solanaTx?: string;
  arweaveTx?: string;
}

const SPInstalls: React.FC = () => {
  const [installAssignments, setInstallAssignments] = useState<InstallAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInstall, setSelectedInstall] = useState<InstallAssignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchInstallAssignments();
  }, []);

  const fetchInstallAssignments = async () => {
    try {
      setLoading(true);
      const response = await ServiceInstallsService.getAssignedInstallations();
      
      if (response.success) {
        
        // Transform API response to match our component interface
        const assignments: InstallAssignment[] = response.data.installations.map((install: any) => ({
          id: install.id,
          vehicleId: install.vehicleId,
          vehicle: {
            id: install.vehicle?._id || install.vehicle?.id || '',
            make: install.vehicle?.make || '',
            model: install.vehicle?.vehicleModel || install.vehicle?.model || '',
            year: install.vehicle?.year || 0,
            vin: install.vehicle?.vin || '',
            lastVerifiedMileage: install.vehicle?.lastVerifiedMileage
          },
          owner: {
            id: install.owner?._id || install.owner?.id || '',
            name: `${install.owner?.firstName || ''} ${install.owner?.lastName || ''}`.trim() || install.owner?.name || '',
            email: install.owner?.email || ''
          },
          status: install.status,
          assignedAt: install.assignedAt || install.requestedAt || '',
          deviceId: install.deviceId,
          initialMileage: install.initialMileage
        }));
        setInstallAssignments(assignments);
      }
    } catch (error) {
      console.error('❌ Failed to fetch install assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartInstallation = (install: InstallAssignment) => {
    setSelectedInstall(install);
    setIsModalOpen(true);
  };

  const handleInstallSubmit = async (data: { deviceId: string; initialMileage: number }) => {
    if (!selectedInstall) {
      throw new Error('No installation selected');
    }
    
    try {
      const response = await ServiceInstallsService.startInstallation({
        installId: selectedInstall.id,
        deviceId: data.deviceId,
        initialMileage: data.initialMileage
      });
      
      if (response.success) {
        // Update the local state to reflect the change
        setInstallAssignments(prev => prev.map(install => 
          install.id === selectedInstall.id 
            ? { 
                ...install, 
                status: 'in_progress' as 'in_progress',
                deviceId: data.deviceId,
                initialMileage: data.initialMileage
              } 
            : install
        ));
        return {
          solanaTx: response.data.solanaTx,
          arweaveTx: response.data.arweaveTx
        };
      } else {
        throw new Error(response.message || 'Failed to start installation');
      }
    } catch (error) {
      console.error('Failed to start installation:', error);
      throw error;
    }
  };

  const handleCompleteInstallation = async (installId: string) => {
    try {
      const response = await ServiceInstallsService.completeInstallation({
        installId: installId,
        finalNotes: 'Installation completed successfully'
      });
      
      if (response.success) {
        // Update the local state to reflect the completion
        setInstallAssignments(prev => prev.map(install => 
          install.id === installId 
            ? { 
                ...install, 
                status: 'completed' as 'completed',
                completedAt: new Date().toISOString()
              } 
            : install
        ));
        
        // Refresh the list to get updated data
        await fetchInstallAssignments();
        
        return response;
      } else {
        throw new Error(response.message || 'Failed to complete installation');
      }
    } catch (error) {
      console.error('Failed to complete installation:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'flagged': return 'bg-red-100 text-red-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'requested': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredAssignments = installAssignments.filter(assignment => {
    const matchesSearch = 
      assignment.vehicle.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.owner.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="mt-4 h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Installation Assignments</h1>
            <p className="text-gray-600">Manage your assigned device installations</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="Search by VIN, owner name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full sm:w-auto pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="requested">Requested</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="flagged">Flagged</option>
          </select>
          <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
            <Filter className="w-5 h-5 mr-2" />
            More Filters
          </button>
        </div>

        {/* Install Assignments List */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No installation assignments found</h3>
            <p className="text-gray-500">You have no assigned installations at this time.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Device ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssignments.map((assignment, index) => (
                    <motion.tr
                      key={assignment.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.vehicle.year} {assignment.vehicle.make} {assignment.vehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">{assignment.vehicle.vin}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{assignment.owner.name}</div>
                        <div className="text-sm text-gray-500">{assignment.owner.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.deviceId || 'Not installed'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {assignment.status === 'assigned' ? (
                          <button
                            onClick={() => handleStartInstallation(assignment)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </button>
                        ) : assignment.status === 'in_progress' ? (
                          <button
                            onClick={() => handleCompleteInstallation(assignment.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Complete
                          </button>
                        ) : assignment.status === 'completed' ? (
                          <div className="flex items-center text-green-600">
                            <Check className="w-4 h-4 mr-1" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 capitalize">{assignment.status.replace('_', ' ')}</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <InstallStartModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={selectedInstall?.vehicle || { id: '', make: '', model: '', year: 0, vin: '' }}
        onSubmit={handleInstallSubmit}
      />
    </>
  );
};

export default SPInstalls;