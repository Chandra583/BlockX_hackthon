import React from 'react';
import { motion } from 'framer-motion';
import { Car, User, Calendar, Hash, Copy } from 'lucide-react';
import type { VehicleReportData } from '../../../services/report';
import toast from 'react-hot-toast';

interface ReportHeaderProps {
  report: VehicleReportData;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ report }) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50"
    >
      {/* Vehicle Title */}
      <div className="flex items-center mb-6">
        <div className="p-4 bg-blue-600/20 rounded-2xl mr-6">
          <Car className="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {report.vehicle.year} {report.vehicle.make} {report.vehicle.model}
          </h2>
          <p className="text-gray-300 text-lg">VIN: {report.vehicle.vin}</p>
        </div>
      </div>

      {/* Vehicle Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Registration Number */}
        <div className="p-4 bg-slate-700/50 rounded-xl">
          <div className="flex items-center mb-2">
            <Hash className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-gray-300 text-sm">Registration</span>
          </div>
          <p className="text-white font-semibold">{report.vehicle.vehicleNumber}</p>
        </div>

        {/* Current Mileage */}
        <div className="p-4 bg-slate-700/50 rounded-xl">
          <div className="flex items-center mb-2">
            <Car className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-gray-300 text-sm">Current Mileage</span>
          </div>
          <p className="text-white font-semibold">{report.vehicle.currentMileage.toLocaleString()} km</p>
        </div>

        {/* Color */}
        <div className="p-4 bg-slate-700/50 rounded-xl">
          <div className="flex items-center mb-2">
            <div className="w-5 h-5 rounded-full bg-gray-400 mr-2"></div>
            <span className="text-gray-300 text-sm">Color</span>
          </div>
          <p className="text-white font-semibold capitalize">{report.vehicle.color}</p>
        </div>
      </div>

      {/* Owner Information */}
      <div className="mt-8 p-6 bg-slate-700/30 rounded-xl">
        <div className="flex items-center mb-4">
          <div className="p-3 bg-green-600/20 rounded-xl mr-4">
            <User className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white">Owner Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-gray-400 text-sm">Owner Name</span>
            <p className="text-white font-semibold">{report.owner.fullName}</p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Email</span>
            <div className="flex items-center">
              <p className="text-white font-semibold mr-2">{report.owner.email}</p>
              <button
                onClick={() => copyToClipboard(report.owner.email, 'Email')}
                className="p-1 hover:bg-slate-600 rounded"
              >
                <Copy className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Registration Date</span>
            <p className="text-white font-semibold">
              {new Date(report.owner.registrationDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-gray-400 text-sm">Verification Status</span>
            <p className={`font-semibold ${
              report.vehicle.verificationStatus === 'verified' ? 'text-green-400' :
              report.vehicle.verificationStatus === 'pending' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {report.vehicle.verificationStatus.charAt(0).toUpperCase() + report.vehicle.verificationStatus.slice(1)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
