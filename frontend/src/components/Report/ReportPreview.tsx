import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils/formatCurrency';
import {
  Car,
  User,
  Shield,
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Eye,
  Copy,
  Star,
  Hash,
  Calendar,
  Gauge,
  Activity,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { VehicleReportData } from '../../services/report';
import { ReportHeader } from '../../pages/Vehicles/components/ReportHeader';
import { ReportBatches } from '../../pages/Vehicles/components/ReportBatches';
import { ReportRollbackList } from '../../pages/Vehicles/components/ReportRollbackList';
import { ReportTrustSummary } from '../../pages/Vehicles/components/ReportTrustSummary';

interface ReportPreviewProps {
  report: VehicleReportData;
  onCopyLink: () => void;
  onCopyToClipboard: (text: string, label: string) => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  onCopyLink,
  onCopyToClipboard
}) => {
  const [expandedSections, setExpandedSections] = useState({
    owner: true,
    blockchain: true,
    batches: true,
    rollbacks: true,
    trustScore: true,
    marketplace: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const sections = [
    { id: 'owner', title: 'Owner Information', icon: User },
    { id: 'blockchain', title: 'Blockchain Verification', icon: Shield },
    { id: 'batches', title: 'OBD Telemetry Batches', icon: Activity },
    { id: 'rollbacks', title: 'Fraud & Rollback Events', icon: AlertTriangle },
    { id: 'trustScore', title: 'TrustScore Analysis', icon: Gauge },
    { id: 'marketplace', title: 'Marketplace Status', icon: DollarSign }
  ];

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {report.vehicle.year} {report.vehicle.make} {report.vehicle.model}
              </h3>
              <p className="text-slate-300">
                VIN: {report.vehicle.vin} • {report.vehicle.vehicleNumber}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCopyLink}
              className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
              title="Copy Report Link"
            >
              <Copy className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-slate-300">TrustScore</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {report.trustScore.score}
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-slate-300">OBD Batches</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {report.lastBatches.length}
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-slate-300">Rollback Events</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {report.rollbackEvents.length}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table of Contents */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50"
      >
        <h4 className="text-lg font-semibold text-white mb-3">Report Sections</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id as keyof typeof expandedSections];
            
            return (
              <motion.button
                key={section.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleSection(section.id as keyof typeof expandedSections)}
                className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
                  isExpanded 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                    : 'bg-slate-700/30 text-slate-300 hover:bg-slate-600/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{section.title}</span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 ml-auto" />
                ) : (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Owner Information */}
      {expandedSections.owner && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <ReportHeader 
            report={report}
          />
        </motion.div>
      )}

      {/* Blockchain Verification */}
      {expandedSections.blockchain && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Blockchain Verification</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Solana Transaction</span>
                <div className="flex items-center space-x-2">
                  {report.registeredOnChain.solanaTxHash ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-xs text-green-400">Anchored</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-yellow-400">Pending</span>
                    </>
                  )}
                </div>
              </div>
              
              {report.registeredOnChain.solanaTxHash ? (
                <div className="flex items-center space-x-2">
                  <code className="text-sm text-blue-300 font-mono bg-slate-800/50 px-2 py-1 rounded">
                    {report.registeredOnChain.solanaTxHash.slice(0, 8)}...{report.registeredOnChain.solanaTxHash.slice(-8)}
                  </code>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onCopyToClipboard(report.registeredOnChain.solanaTxHash!, 'Solana TxHash')}
                    className="p-1 rounded hover:bg-slate-600/50 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3 h-3" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(`https://explorer.solana.com/tx/${report.registeredOnChain.solanaTxHash}`, '_blank')}
                    className="p-1 rounded hover:bg-slate-600/50 text-slate-400 hover:text-white"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </motion.button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Not anchored yet</p>
              )}
            </div>

            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">Registration Date</span>
              </div>
              <p className="text-sm text-slate-300">
                {new Date(report.registeredOnChain.timestamp).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* OBD Telemetry Batches */}
      {expandedSections.batches && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <ReportBatches batches={report.lastBatches} />
        </motion.div>
      )}

      {/* Fraud & Rollback Events */}
      {expandedSections.rollbacks && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <ReportRollbackList events={report.rollbackEvents} />
        </motion.div>
      )}

      {/* TrustScore Analysis */}
      {expandedSections.trustScore && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <ReportTrustSummary trustScore={report.trustScore} />
        </motion.div>
      )}

      {/* Marketplace Status */}
      {expandedSections.marketplace && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50"
        >
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Marketplace Status</h3>
          </div>
          
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">Listing Status</span>
              <div className="flex items-center space-x-2">
                {report.listing.isListed ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">Listed</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-400">Not Listed</span>
                  </>
                )}
              </div>
            </div>
            
            {report.listing.isListed && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Price</span>
                  <span className="text-lg font-bold text-white">
                    {formatPrice(report.listing.price)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">Listed Date</span>
                  <span className="text-sm text-slate-300">
                    {report.listing.listedAt ? new Date(report.listing.listedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
