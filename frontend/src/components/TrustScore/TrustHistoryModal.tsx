import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Clock, Shield, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { TrustEventDetail } from './TrustEventDetail';
import { TrustService } from '../../services/trust';

interface TrustEvent {
  _id: string;
  change: number;
  previousScore: number;
  newScore: number;
  reason: string;
  source: string;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  details: any;
}

interface TrustHistoryModalProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TrustHistoryModal: React.FC<TrustHistoryModalProps> = ({
  vehicleId,
  isOpen,
  onClose
}) => {
  const [events, setEvents] = useState<TrustEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TrustEvent | null>(null);
  const [filter, setFilter] = useState<'all' | 'negative' | 'positive'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen, filter, page]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await TrustService.getTrustHistory(vehicleId, {
        page,
        limit: 10,
        filter
      });
      
      if (page === 1) {
        setEvents(response.data);
      } else {
        setEvents(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
    } catch (error) {
      console.error('Failed to load trust events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChangeIcon = (change: number) => {
    return change > 0 ? (
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      telemetry: 'OBD Device',
      admin: 'Admin',
      manual: 'Manual',
      fraudEngine: 'Fraud Detection',
      anchor: 'Blockchain'
    };
    return labels[source as keyof typeof labels] || source;
  };

  const getEventIcon = (source: string, change: number) => {
    if (source === 'fraudEngine' || change < 0) {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    if (source === 'telemetry' && change > 0) {
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    }
    return <Zap className="w-5 h-5 text-blue-500" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                onClick={onClose}
              />
            </motion.div>

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative inline-block align-bottom bg-white/95 backdrop-blur-xl rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border border-white/20"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-8">
                <div className="flex items-center justify-between">
                  <div>
                    <motion.h3 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-2xl font-bold text-white"
                    >
                      TrustScore History
                    </motion.h3>
                    <motion.p 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-blue-100 mt-1"
                    >
                      Track changes to your vehicle's trust score
                    </motion.p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </motion.button>
                </div>
              </div>

              <div className="px-6 py-6">
                {/* Filter Tabs */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex space-x-2 mb-6"
                >
                  {(['all', 'negative', 'positive'] as const).map((filterType) => (
                    <motion.button
                      key={filterType}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setFilter(filterType);
                        setPage(1);
                      }}
                      className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                        filter === filterType
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {filterType === 'all' ? 'All' : filterType === 'negative' ? 'Decreases' : 'Increases'}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Events List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {loading && events.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-gray-500 text-lg">Loading trust events...</p>
                    </motion.div>
                  ) : events.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No trust events found</p>
                    </motion.div>
                  ) : (
                    events.map((event, index) => (
                      <motion.div
                        key={event._id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="group border border-gray-200/60 rounded-2xl p-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 cursor-pointer transition-all duration-300 backdrop-blur-sm bg-white/80"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 10 }}
                              className="p-2 rounded-xl bg-white/80 shadow-sm"
                            >
                              {getEventIcon(event.source, event.change)}
                            </motion.div>
                            <div>
                              <p className="font-semibold text-gray-900 text-lg group-hover:text-blue-900 transition-colors">
                                {event.reason}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-500 font-medium">
                                  {getSourceLabel(event.source)}
                                </span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-500">
                                  {formatDate(event.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <motion.div 
                            className="text-right"
                            whileHover={{ scale: 1.05 }}
                          >
                            <div className="flex items-center space-x-2">
                              {getChangeIcon(event.change)}
                              <p className={`font-bold text-lg ${getChangeColor(event.change)}`}>
                                {event.change > 0 ? '+' : ''}{event.change}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {event.previousScore} → {event.newScore}
                            </p>
                          </motion.div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Load More */}
                {hasMore && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 text-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Clock className="w-4 h-4" />
                          </motion.div>
                          <span>Loading...</span>
                        </div>
                      ) : (
                        'Load More Events'
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {selectedEvent && (
        <TrustEventDetail
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </AnimatePresence>
  );
};