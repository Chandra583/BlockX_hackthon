import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft,
  Star,
  Hash,
  Calendar,
  Gauge,
  Activity,
  RefreshCw,
  X,
  Zap,
  Lock
} from 'lucide-react';
import { ReportService } from '../../services/report';
import { formatPrice } from '../../utils/formatCurrency';
import type { VehicleReportData } from '../../services/report';
import toast from 'react-hot-toast';

interface ViewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    vin: string;
    vehicleNumber: string;
  };
  onRequestToBuy?: (vehicleId: string) => void;
}

export const ViewReportModal: React.FC<ViewReportModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleInfo,
  onRequestToBuy
}) => {
  const [reportData, setReportData] = useState<VehicleReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    blockchain: true,
    batches: true,
    rollbacks: false,
    trustScore: true
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReportData(null);
      setError(null);
      fetchReportData();
    }
  }, [isOpen, vehicleId]);

  const fetchReportData = async () => {
    if (!vehicleId) return;
    
    try {
      setLoading(true);
      setError(null);
      const report = await ReportService.getVehicleReport(vehicleId);
      setReportData(report);
    } catch (error: any) {
      console.error('Failed to fetch report:', error);
      setError(error.message || 'Failed to fetch vehicle report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!vehicleId) return;

    try {
      setGeneratingPDF(true);

      // Try server-side PDF generation first
      try {
        const blob = await ReportService.downloadPDFReport(vehicleId);
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank');
          const a = document.createElement('a');
          a.href = url;
          a.download = `vehicle-report-${vehicleId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success('PDF downloaded successfully!');
          return;
        }
      } catch (e) {
        console.log('Server PDF generation failed, trying fallback...');
      }

      // Fallback: Generate PDF URL
      try {
        const gen = await ReportService.generatePDFReport(vehicleId) as any;
        const url = gen?.downloadUrl;
        if (url) {
          const res = await fetch(url, { credentials: 'include' });
          const ct = res.headers.get('content-type') || '';
          if (!res.ok || !ct.includes('pdf')) throw new Error('Not a PDF');
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `vehicle-report-${vehicleId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success('PDF downloaded successfully!');
          return;
        }
      } catch (e) {
        console.log('PDF URL generation failed, using JSON fallback...');
      }

      // Final fallback: Export as JSON
      const report = reportData || await ReportService.getVehicleReport(vehicleId);
      const dataStr = JSON.stringify(report, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `vehicle-report-${vehicleId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast('PDF not available. Exported as JSON.', { icon: 'ℹ️' });
    } catch (error: any) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-6xl mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Vehicle Report
                    </h2>
                    {vehicleInfo && (
                      <p className="text-slate-300">
                        {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Download PDF Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownloadPDF}
                    disabled={generatingPDF}
                    className="inline-flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-blue-600 to-teal-600 text-white hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                  >
                    {generatingPDF ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download PDF
                  </motion.button>

                  {/* Request to Buy Button */}
                  {onRequestToBuy && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onRequestToBuy(vehicleId)}
                      className="inline-flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Request to Buy
                    </motion.button>
                  )}

                  {/* Close Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-red-300">{error}</p>
                    </div>
                  </motion.div>
                )}

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    {/* Loading Skeletons */}
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="bg-slate-700/30 rounded-xl p-6 animate-pulse">
                        <div className="h-4 bg-slate-600/50 rounded w-1/3 mb-4"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-600/50 rounded w-full"></div>
                          <div className="h-3 bg-slate-600/50 rounded w-2/3"></div>
                          <div className="h-3 bg-slate-600/50 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {reportData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Vehicle & Owner Info */}
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <Car className="w-6 h-6 text-blue-400" />
                        <h3 className="text-lg font-semibold text-white">Vehicle Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Vehicle Details</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-slate-400">VIN:</span> <span className="text-white font-mono">{reportData.vehicle?.vin || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Registration:</span> <span className="text-white">{reportData.vehicle?.vehicleNumber || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Make/Model:</span> <span className="text-white">{reportData.vehicle?.make || 'N/A'} {reportData.vehicle?.model || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Year:</span> <span className="text-white">{reportData.vehicle?.year || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Mileage:</span> <span className="text-white">{reportData.vehicle?.currentMileage?.toLocaleString() || 'N/A'} km</span></p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Owner Information</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-slate-400">Name:</span> <span className="text-white">{reportData.owner?.fullName || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Email:</span> <span className="text-white">{reportData.owner?.email || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Registered:</span> <span className="text-white">{reportData.owner?.registrationDate ? new Date(reportData.owner.registrationDate).toLocaleDateString() : 'N/A'}</span></p>
                          </div>
                        </div>
                      </div>

                      {/* OBD Device Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">OBD Device</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-slate-400">Device ID:</span> <span className="text-white font-mono">{reportData.obdInfo?.deviceId || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Installed:</span> <span className="text-white">{reportData.obdInfo?.installedAt ? new Date(reportData.obdInfo.installedAt).toLocaleDateString() : 'N/A'}</span></p>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Service Provider & Usage</h4>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-slate-400">Provider:</span> <span className="text-white">{reportData.obdInfo?.serviceProvider?.name || 'N/A'}</span></p>
                            <p><span className="text-slate-400">Total Driven:</span> <span className="text-white">{(reportData.obdInfo?.totalDrivenKm ?? 0).toLocaleString()} km</span></p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Blockchain Verification */}
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Shield className="w-6 h-6 text-green-400" />
                          <h3 className="text-lg font-semibold text-white">Blockchain Verification</h3>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleSection('blockchain')}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 transition-colors"
                        >
                          {expandedSections.blockchain ? <Minus className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </motion.button>
                      </div>
                      
                      {expandedSections.blockchain && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-700/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-300">Solana Transaction</span>
                                <div className="flex items-center space-x-2">
                                  {reportData.registeredOnChain?.solanaTxHash ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <span className="text-xs text-green-400">Verified</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                      <span className="text-xs text-yellow-400">Pending</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {reportData.registeredOnChain?.solanaTxHash ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-400 font-mono break-all">
                                    {reportData.registeredOnChain.solanaTxHash.slice(0, 20)}...{reportData.registeredOnChain.solanaTxHash.slice(-8)}
                                  </p>
                                  <div className="flex space-x-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => copyToClipboard(reportData.registeredOnChain.solanaTxHash!, 'Transaction hash')}
                                      className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors"
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </motion.button>
                                    <motion.a
                                      href={(reportData.registeredOnChain as any)?.explorer?.solana || `https://explorer.solana.com/tx/${reportData.registeredOnChain.solanaTxHash}?cluster=devnet`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors flex items-center"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      View
                                    </motion.a>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">Not anchored yet</p>
                              )}
                            </div>

                            <div className="p-4 bg-slate-700/30 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-slate-300">Arweave Storage</span>
                                <div className="flex items-center space-x-2">
                                  {reportData.registeredOnChain?.arweaveTx ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 text-green-400" />
                                      <span className="text-xs text-green-400">Stored</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                      <span className="text-xs text-yellow-400">Pending</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {reportData.registeredOnChain?.arweaveTx ? (
                                <div className="space-y-2">
                                  <p className="text-xs text-slate-400 font-mono break-all">
                                    {reportData.registeredOnChain.arweaveTx.slice(0, 20)}...{reportData.registeredOnChain.arweaveTx.slice(-8)}
                                  </p>
                                  <div className="flex space-x-2">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => copyToClipboard(reportData.registeredOnChain.arweaveTx!, 'Arweave hash')}
                                      className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors"
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </motion.button>
                                    <motion.a
                                      href={(reportData.registeredOnChain as any)?.explorer?.arweave || `https://arweave.net/${reportData.registeredOnChain.arweaveTx}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors flex items-center"
                                    >
                                      <ExternalLink className="w-3 h-3 mr-1" />
                                      View
                                    </motion.a>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400">Not stored yet</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                            <div className="flex items-center">
                              <Calendar className="w-5 h-5 text-blue-400 mr-3" />
                              <span className="text-gray-300">Registered</span>
                            </div>
                            <span className="text-white text-sm">
                              {reportData.registeredOnChain?.timestamp ? new Date(reportData.registeredOnChain.timestamp).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* OBD Installation */}
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Activity className="w-6 h-6 text-cyan-400" />
                          <h3 className="text-lg font-semibold text-white">OBD Installation</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 text-sm">
                          <p><span className="text-slate-400">Device ID:</span> <span className="text-white font-mono">{reportData.obdInfo?.deviceId || 'N/A'}</span></p>
                          <p><span className="text-slate-400">Installed:</span> <span className="text-white">{reportData.obdInfo?.installedAt ? new Date(reportData.obdInfo.installedAt).toLocaleDateString() : 'N/A'}</span></p>
                          <p><span className="text-slate-400">Initial Mileage:</span> <span className="text-white">{reportData.obdInfo?.initialMileage != null ? `${reportData.obdInfo.initialMileage.toLocaleString()} km` : 'N/A'}</span></p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-slate-400">Service Provider:</span> <span className="text-white">{reportData.obdInfo?.serviceProvider?.name || 'N/A'}</span></p>
                          <p><span className="text-slate-400">Total Driven:</span> <span className="text-white">{(reportData.obdInfo?.totalDrivenKm ?? 0).toLocaleString()} km</span></p>
                          <p><span className="text-slate-400">Batches:</span> <span className="text-white">{reportData.obdInfo?.batchesCount ?? 0}</span></p>
                        </div>
                      </div>

                      {/* Installation Hashes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Installation Solana Tx</span>
                            <div className="flex items-center space-x-2">
                              {reportData.obdInfo?.installation?.solanaTx ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  <span className="text-xs text-green-400">Anchored</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                  <span className="text-xs text-yellow-400">Pending</span>
                                </>
                              )}
                            </div>
                          </div>
                          {reportData.obdInfo?.installation?.solanaTx ? (
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => copyToClipboard(reportData.obdInfo!.installation!.solanaTx!, 'Installation Solana Tx')}
                                className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </motion.button>
                              <motion.a
                                href={reportData.obdInfo?.installation?.explorer?.solana || `https://explorer.solana.com/tx/${reportData.obdInfo?.installation?.solanaTx}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </motion.a>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">Not anchored yet</p>
                          )}
                        </div>

                        <div className="p-4 bg-slate-700/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Installation Arweave Tx</span>
                            <div className="flex items-center space-x-2">
                              {reportData.obdInfo?.installation?.arweaveTx ? (
                                <>
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                  <span className="text-xs text-green-400">Stored</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                  <span className="text-xs text-yellow-400">Pending</span>
                                </>
                              )}
                            </div>
                          </div>
                          {reportData.obdInfo?.installation?.arweaveTx ? (
                            <div className="flex items-center space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => copyToClipboard(reportData.obdInfo!.installation!.arweaveTx!, 'Installation Arweave Tx')}
                                className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors"
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </motion.button>
                              <motion.a
                                href={reportData.obdInfo?.installation?.explorer?.arweave || `https://arweave.net/${reportData.obdInfo?.installation?.arweaveTx}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs hover:bg-blue-600/30 transition-colors flex items-center"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </motion.a>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">Not stored yet</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Last 10 OBD Batches */}
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Activity className="w-6 h-6 text-purple-400" />
                          <h3 className="text-lg font-semibold text-white">Last 10 OBD Batches</h3>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleSection('batches')}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 transition-colors"
                        >
                          {expandedSections.batches ? <Minus className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </motion.button>
                      </div>
                      
                      {expandedSections.batches && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          {reportData.lastBatches?.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No OBD batches recorded yet</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-700/50">
                                    <th className="text-left py-3 px-4 text-slate-300">Date</th>
                                    <th className="text-left py-3 px-4 text-slate-300">Device</th>
                                    <th className="text-left py-3 px-4 text-slate-300">Mileage</th>
                                    <th className="text-left py-3 px-4 text-slate-300">Distance</th>
                                    <th className="text-left py-3 px-4 text-slate-300">Status</th>
                                    <th className="text-left py-3 px-4 text-slate-300">Blockchain</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(reportData.lastBatches || []).map((batch, index) => (
                                    <tr key={batch.id} className="border-b border-slate-700/30">
                                      <td className="py-3 px-4 text-slate-300">
                                        {new Date(batch.recordedAt).toLocaleDateString()}
                                      </td>
                                      <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                                        {batch.deviceId.slice(0, 8)}...
                                      </td>
                                      <td className="py-3 px-4 text-slate-300">
                                        {batch.startMileage.toLocaleString()} - {batch.endMileage.toLocaleString()} km
                                      </td>
                                      <td className="py-3 px-4 text-slate-300">
                                        {batch.distance.toLocaleString()} km
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                                          batch.status === 'anchored' ? 'bg-green-500/20 text-green-400' :
                                          batch.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                          'bg-red-500/20 text-red-400'
                                        }`}>
                                          {batch.status === 'anchored' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                                           batch.status === 'pending' ? <Clock className="w-3 h-3 mr-1" /> :
                                           <AlertTriangle className="w-3 h-3 mr-1" />}
                                          {batch.status}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        {batch.blockchainHash ? (
                                          <div className="flex items-center space-x-2">
                                            <motion.button
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                              onClick={() => copyToClipboard(batch.blockchainHash!, 'Blockchain hash')}
                                              className="text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                              <Copy className="w-3 h-3" />
                                            </motion.button>
                                            <a
                                              href={`https://explorer.solana.com/tx/${batch.blockchainHash}?cluster=devnet`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-400 hover:text-blue-300 font-mono"
                                            >
                                              {batch.blockchainHash.slice(0, 8)}...
                                            </a>
                                          </div>
                                        ) : (
                                          <span className="text-xs text-slate-500">Not anchored</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Rollback Events */}
                    {reportData.rollbackEvents?.length > 0 && (
                      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <AlertTriangle className="w-6 h-6 text-red-400" />
                            <h3 className="text-lg font-semibold text-white">Rollback Events</h3>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleSection('rollbacks')}
                            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 transition-colors"
                          >
                            {expandedSections.rollbacks ? <Minus className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </motion.button>
                        </div>
                        
                        {expandedSections.rollbacks && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3"
                          >
                            {(reportData.rollbackEvents || []).map((event, index) => (
                              <div key={event.id} className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-red-300">
                                    Rollback Detected
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {new Date(event.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-slate-400">Previous:</span>
                                    <span className="text-white ml-2">{event.prevMileage.toLocaleString()} km</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">New:</span>
                                    <span className="text-white ml-2">{event.newMileage.toLocaleString()} km</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Delta:</span>
                                    <span className="text-red-400 ml-2">{event.deltaKm.toLocaleString()} km</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-400">Status:</span>
                                    <span className={`ml-2 ${
                                      event.resolutionStatus === 'resolved' ? 'text-green-400' :
                                      event.resolutionStatus === 'investigating' ? 'text-yellow-400' :
                                      'text-red-400'
                                    }`}>
                                      {event.resolutionStatus}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">{event.detectionReason}</p>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* TrustScore Summary */}
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Shield className="w-6 h-6 text-green-400" />
                          <h3 className="text-lg font-semibold text-white">TrustScore Summary</h3>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleSection('trustScore')}
                          className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 transition-colors"
                        >
                          {expandedSections.trustScore ? <Minus className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </motion.button>
                      </div>
                      
                      {expandedSections.trustScore && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                (reportData.trustScore?.score || 0) >= 90 ? 'bg-green-500/20 text-green-400' :
                                (reportData.trustScore?.score || 0) >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                <span className="text-lg font-bold">{reportData.trustScore?.score || 'N/A'}</span>
                              </div>
                              <div>
                                <p className="text-white font-semibold">Current TrustScore</p>
                                <p className="text-sm text-slate-400">
                                  Last updated: {reportData.trustScore?.lastUpdated ? new Date(reportData.trustScore.lastUpdated).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {reportData.trustScore?.trend === 'increasing' ? (
                                <TrendingUp className="w-5 h-5 text-green-400" />
                              ) : reportData.trustScore?.trend === 'decreasing' ? (
                                <TrendingDown className="w-5 h-5 text-red-400" />
                              ) : (
                                <Minus className="w-5 h-5 text-slate-400" />
                              )}
                              <span className={`text-sm font-medium ${
                                reportData.trustScore?.trend === 'increasing' ? 'text-green-400' :
                                reportData.trustScore?.trend === 'decreasing' ? 'text-red-400' :
                                'text-slate-400'
                              }`}>
                                {reportData.trustScore?.trend || 'stable'}
                              </span>
                            </div>
                          </div>

                          {reportData.trustScore?.topCauses?.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-slate-300 mb-3">Recent Changes</h4>
                              <div className="space-y-2">
                                {reportData.trustScore?.topCauses?.map((cause, index) => (
                                  <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                                    <div>
                                      <p className="text-sm text-white">{cause?.reason || 'N/A'}</p>
                                      <p className="text-xs text-slate-400">
                                        {cause?.timestamp ? new Date(cause.timestamp).toLocaleDateString() : 'N/A'}
                                      </p>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${
                                      (cause?.change || 0) > 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                      {(cause?.change || 0) > 0 ? (
                                        <TrendingUp className="w-4 h-4" />
                                      ) : (
                                        <TrendingDown className="w-4 h-4" />
                                      )}
                                      <span className="text-sm font-medium">
                                        {(cause?.change || 0) > 0 ? '+' : ''}{cause?.change || 0}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    {/* Marketplace Status */}
                    {reportData.listing?.isListed && (
                      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <div className="flex items-center space-x-3 mb-4">
                          <DollarSign className="w-6 h-6 text-green-400" />
                          <h3 className="text-lg font-semibold text-white">Marketplace Status</h3>
                        </div>
                        
                        <div className="bg-slate-700/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Listing Status</span>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-400" />
                              <span className="text-xs text-green-400">Listed</span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-300">Price</span>
                              <span className="text-lg font-bold text-white">
                                {formatPrice(reportData.listing?.price)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-300">Listed Date</span>
                              <span className="text-sm text-slate-300">
                                {reportData.listing?.listedAt ? new Date(reportData.listing.listedAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ViewReportModal;
