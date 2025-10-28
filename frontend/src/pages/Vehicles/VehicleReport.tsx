import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft,
  Star,
  Hash,
  Calendar,
  Gauge,
  Activity
} from 'lucide-react';
import { ReportService } from '../../services/report';
import type { VehicleReportData } from '../../services/report';
import { ListForSaleModal } from './components/ListForSaleModal';
import { ReportHeader } from './components/ReportHeader';
import { ReportBatches } from './components/ReportBatches';
import { ReportRollbackList } from './components/ReportRollbackList';
import { ReportTrustSummary } from './components/ReportTrustSummary';
import toast from 'react-hot-toast';

const VehicleReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<VehicleReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    // Don't auto-fetch report, let user generate it manually
  }, [id]);

  const generateReport = async () => {
    if (!id) return;
    
    try {
      setGeneratingReport(true);
      setError(null);
      const reportData = await ReportService.getVehicleReport(id);
      setReport(reportData);
      setReportGenerated(true);
      toast.success('Vehicle report generated successfully!');
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      setError(error.message || 'Failed to generate vehicle report');
      toast.error('Failed to generate vehicle report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleListForSale = async (listingData: any) => {
    if (!id) return;
    
    try {
      const response = await ReportService.listVehicleForSale(id, listingData);
      toast.success('Vehicle listed for sale successfully!');
      setShowListModal(false);
      
      // Refresh report to show updated listing status
      await generateReport();
      
      // Show success modal with marketplace link
      toast.success(
        <div className="space-y-2">
          <p>Vehicle listed successfully!</p>
          <button
            onClick={() => window.open(response.marketplaceLink, '_blank')}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Listing
          </button>
        </div>,
        { duration: 5000 }
      );
    } catch (error: any) {
      console.error('Failed to list vehicle:', error);
      toast.error(error.message || 'Failed to list vehicle for sale');
    }
  };

  const handleGeneratePDF = async () => {
    if (!id) return;
    
    try {
      setGeneratingPDF(true);
      const pdfData = await ReportService.generatePDFReport(id);
      
      // Create download link
      const link = document.createElement('a');
      link.href = pdfData.downloadUrl;
      link.download = `vehicle-report-${report?.vehicle.vin}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('PDF report downloaded successfully!');
    } catch (error: any) {
      console.error('Failed to generate PDF:', error);
      toast.error('Failed to generate PDF report');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'anchored':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  if (generatingReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Generating vehicle report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Generating Report</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/vehicles')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Back to Vehicles
            </button>
            <button
              onClick={generateReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!reportGenerated || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50"
          >
            <div className="p-4 bg-blue-600/20 rounded-2xl mb-6 inline-block">
              <FileText className="w-16 h-16 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Generate Vehicle Report</h1>
            <p className="text-gray-300 text-lg mb-8">
              Generate a comprehensive report for your vehicle including TrustScore, OBD data, fraud alerts, and blockchain verification.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-center text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                <span>Vehicle information and owner details</span>
              </div>
              <div className="flex items-center text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                <span>Last 10 OBD telemetry batches</span>
              </div>
              <div className="flex items-center text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                <span>Fraud alerts and rollback events</span>
              </div>
              <div className="flex items-center text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                <span>TrustScore history and trends</span>
              </div>
              <div className="flex items-center text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                <span>Blockchain verification status</span>
              </div>
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/vehicles')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Back to Vehicles
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={generateReport}
                className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FileText className="w-5 h-5 mr-2 inline" />
                Generate Report
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div>
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/vehicles/${id}`)}
              className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4 font-semibold transition-colors bg-slate-800/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-700/50"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Vehicle Details
            </motion.button>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-black text-white mb-2 gradient-text"
            >
              Vehicle Report
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-gray-300 text-lg font-medium"
            >
              {report.vehicle.year} {report.vehicle.make} {report.vehicle.model}
            </motion.p>
          </div>
          
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="inline-flex items-center bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {generatingPDF ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              {generatingPDF ? 'Generating...' : 'Download PDF'}
            </motion.button>
            
            {!report.listing.isListed && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowListModal(true)}
                className="inline-flex items-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                List for Sale
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Report Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vehicle Header */}
            <ReportHeader report={report} />
            
            {/* OBD Telemetry Batches */}
            <ReportBatches batches={report.lastBatches} />
            
            {/* Rollback Events */}
            <ReportRollbackList events={report.rollbackEvents} />
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* TrustScore Summary */}
            <ReportTrustSummary trustScore={report.trustScore} />
            
            {/* Blockchain Verification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-600/20 rounded-xl mr-4">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Blockchain Verification</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                  <div className="flex items-center">
                    <Hash className="w-5 h-5 text-blue-400 mr-3" />
                    <span className="text-gray-300">Solana Tx</span>
                  </div>
                  {report.registeredOnChain.solanaTxHash ? (
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-mono text-sm">
                        {report.registeredOnChain.solanaTxHash.slice(0, 8)}...
                      </span>
                      <button
                        onClick={() => copyToClipboard(report.registeredOnChain.solanaTxHash!, 'Transaction hash')}
                        className="p-1 hover:bg-slate-600 rounded"
                      >
                        <Copy className="w-4 h-4 text-gray-400" />
                      </button>
                      <a
                        href={`https://explorer.solana.com/tx/${report.registeredOnChain.solanaTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-slate-600 rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-gray-500 text-sm">Not anchored yet</span>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-400 mr-3" />
                    <span className="text-gray-300">Registered</span>
                  </div>
                  <span className="text-white text-sm">
                    {new Date(report.registeredOnChain.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
            
            {/* Marketplace Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
            >
              <div className="flex items-center mb-6">
                <div className="p-3 bg-green-600/20 rounded-xl mr-4">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Marketplace Status</h3>
              </div>
              
              {report.listing.isListed ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-600/20 rounded-xl border border-green-600/30">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                      <span className="text-green-400 font-semibold">Listed for Sale</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{formatPrice(report.listing.price)}</p>
                    <p className="text-gray-300 text-sm">
                      Listed on {new Date(report.listing.listedAt!).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => window.open(`/marketplace/vehicle/${report.listing.listingId}`, '_blank')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    View Listing
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Not listed for sale</p>
                  <button
                    onClick={() => setShowListModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                  >
                    List for Sale
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* List for Sale Modal */}
      <AnimatePresence>
        {showListModal && (
          <ListForSaleModal
            vehicle={report.vehicle}
            onClose={() => setShowListModal(false)}
            onList={handleListForSale}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VehicleReportPage;
