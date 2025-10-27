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
  X
} from 'lucide-react';
import { ReportService } from '../../services/report';
import type { VehicleReportData } from '../../services/report';
import { ReportPreview } from './ReportPreview';
import { ListForSaleModal } from './ListForSaleModal';
import toast from 'react-hot-toast';

interface VehicleReportModalProps {
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
}

export const VehicleReportModal: React.FC<VehicleReportModalProps> = ({
  isOpen,
  onClose,
  vehicleId,
  vehicleInfo
}) => {
  const [reportData, setReportData] = useState<VehicleReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setReportData(null);
      setError(null);
    }
  }, [isOpen]);

  const handleGenerateReport = async () => {
    if (!vehicleId) return;
    
    try {
      setLoading(true);
      setError(null);
      const report = await ReportService.getVehicleReport(vehicleId);
      setReportData(report);
      toast.success('Vehicle report generated successfully!');
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      setError(error.message || 'Failed to generate vehicle report');
      toast.error('Failed to generate vehicle report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!vehicleId) return;

    try {
      setGeneratingPDF(true);

      // 1) Preferred: direct blob download endpoint
      try {
        const blob = await ReportService.downloadPDFReport(vehicleId);
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          // Open in a new tab for preview and also trigger download
          window.open(url, '_blank');
          const a = document.createElement('a');
          a.href = url;
          a.download = `vehicle-report-${vehicleId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          toast.success('PDF ready');
          return;
        }
      } catch (e) {
        // continue to next strategy
      }

      // 2) If server provides a generation endpoint returning a URL
      try {
        const gen = await ReportService.generatePDFReport(vehicleId) as any;
        const url = gen?.downloadUrl;
        if (url) {
          // Fetch the URL as blob to ensure correct content-type
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
          toast.success('PDF ready');
          return;
        }
      } catch (e) {
        // continue to fallback
      }

      // 3) Fallback: export JSON so the user still gets the data
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

  const handleCopyReportLink = () => {
    const reportUrl = `${window.location.origin}/vehicles/${vehicleId}/report`;
    navigator.clipboard.writeText(reportUrl);
    toast.success('Report link copied to clipboard!');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <>
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
                className="relative w-full max-w-7xl mx-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50"
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
                    {/* Generate/Regenerate Report Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleGenerateReport}
                      disabled={loading}
                      className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                        reportData
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      {reportData ? 'Regenerate Report' : 'Generate Report'}
                    </motion.button>

                    {/* Download PDF Button */}
                    {reportData && (
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
                    )}

                    {/* List for Sale Button */}
                    {reportData && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowListModal(true)}
                        className="inline-flex items-center px-4 py-2 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25"
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        List for Sale
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

                  {!reportData && !loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-12"
                    >
                      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Generate Vehicle Report
                      </h3>
                      <p className="text-slate-300 mb-6 max-w-md mx-auto">
                        Create a comprehensive report including blockchain verification, 
                        OBD telemetry history, fraud analysis, and TrustScore details.
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleGenerateReport}
                        className="inline-flex items-center px-6 py-3 rounded-xl font-bold transition-all duration-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25"
                      >
                        <FileText className="w-5 h-5 mr-2" />
                        Generate Report
                      </motion.button>
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
                    >
                      <ReportPreview 
                        report={reportData} 
                        onCopyLink={handleCopyReportLink}
                        onCopyToClipboard={copyToClipboard}
                      />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* List for Sale Modal */}
      <ListForSaleModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        vehicleId={vehicleId}
        vehicleInfo={vehicleInfo}
      />
    </>
  );
};
