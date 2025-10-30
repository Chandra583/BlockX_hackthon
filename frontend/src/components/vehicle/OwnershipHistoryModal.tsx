import React, { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/button';
import { Loader2, Copy, ExternalLink, User as UserIcon, Circle } from 'lucide-react';
import VehicleAPI from '../../api/vehicle';

interface OwnershipEntry {
  ownerId: string;
  fullName: string;
  role: string;
  from: string;
  to?: string | null;
  txHash?: string | null;
  notes?: string;
  contactEmail?: string;
}

interface Props {
  vehicleId: string;
  open: boolean;
  onClose: () => void;
}

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

function EmailMask({ email }: { email?: string }) {
  if (!email) return null;
  const atIndex = email.indexOf('@');
  const domain = atIndex !== -1 ? email.slice(atIndex + 1) : '';
  return (
    <span className="inline-flex items-center gap-1">
      <span>{email}</span>
      {domain && (
        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{domain}</span>
      )}
    </span>
  );
}

export const OwnershipHistoryModal: React.FC<Props> = ({ vehicleId, open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<OwnershipEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await VehicleAPI.getOwnershipHistory(vehicleId);
        setEntries(resp.data || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vehicleId, open]);

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);
  const explorerUrl = (tx: string) => `/explorer/tx/${tx}`;

  const hasPrevious = entries.filter(e => !!e.to).length > 0;

  return (
    <Modal isOpen={open} onClose={onClose} title="Ownership history" theme="dark">
      <div className="space-y-5">
        {loading && (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="animate-spin mr-2" /> Loading history...
          </div>
        )}
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
        {!loading && !error && entries.length === 0 && (
          <div className="text-sm text-slate-400 py-8 text-center">
            No ownership history available.
          </div>
        )}

        {/* Current owner */}
        {entries.filter(e => !e.to).slice(0,1).map((e, idx) => (
          <div key={`current-${idx}`} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
            <div className="flex items-start gap-3">
              <div className="pt-1"><Circle className="text-emerald-400" size={10} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-200">
                    {getInitials(e.fullName) || <UserIcon size={16} />}
                  </div>
                  <div className="font-semibold text-slate-100 truncate">{e.fullName || 'Not available'}</div>
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 whitespace-nowrap">Current owner</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  <span>Owner</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(e.from).toLocaleString()} → Present</span>
                  {e.contactEmail && (
                    <>
                      <span className="mx-1">•</span>
                      <EmailMask email={e.contactEmail} />
                    </>
                  )}
                </div>
                {e.notes && (<div className="mt-1 text-xs text-slate-400">{e.notes}</div>)}
                {e.txHash && (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="text-xs bg-slate-900 text-slate-200 px-2 py-1 rounded truncate max-w-[260px]">{e.txHash}</code>
                    <button className="text-xs inline-flex items-center gap-1 text-slate-300 hover:text-white" onClick={() => copyToClipboard(e.txHash!)}>
                      <Copy size={14} /> Copy
                    </button>
                    <a className="text-xs inline-flex items-center gap-1 text-blue-400 hover:text-blue-300" href={explorerUrl(e.txHash)} target="_blank" rel="noreferrer">
                      <ExternalLink size={14} /> View on explorer
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Previous owners */}
        {hasPrevious && (
          <div className="pt-2">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Previous owners</div>
            <ul className="space-y-3">
              {entries.filter(e => !!e.to).map((e, idx) => (
                <li key={`prev-${idx}`} className="rounded-lg border border-slate-700 bg-slate-800/30 p-4">
                  <div className="flex items-start gap-3">
                    <div className="pt-1"><Circle className="text-slate-500" size={10} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-semibold text-slate-200">
                          {getInitials(e.fullName) || <UserIcon size={16} />}
                        </div>
                        <div className="font-medium text-slate-100 truncate">{e.fullName || 'Not available'}</div>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 whitespace-nowrap">Previous owner</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        <span>Owner</span>
                        <span className="mx-1">•</span>
                        <span>{new Date(e.from).toLocaleString()} → {new Date(e.to as string).toLocaleString()}</span>
                        {e.contactEmail && (
                          <>
                            <span className="mx-1">•</span>
                            <EmailMask email={e.contactEmail} />
                          </>
                        )}
                      </div>
                      {e.notes && (<div className="mt-1 text-xs text-slate-400">{e.notes}</div>)}
                      {e.txHash && (
                        <div className="mt-2 flex items-center gap-2">
                          <code className="text-xs bg-slate-900 text-slate-200 px-2 py-1 rounded truncate max-w-[260px]">{e.txHash}</code>
                          <button className="text-xs inline-flex items-center gap-1 text-slate-300 hover:text-white" onClick={() => copyToClipboard(e.txHash!)}>
                            <Copy size={14} /> Copy
                          </button>
                          <a className="text-xs inline-flex items-center gap-1 text-blue-400 hover:text-blue-300" href={explorerUrl(e.txHash)} target="_blank" rel="noreferrer">
                            <ExternalLink size={14} /> View on explorer
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" className="bg-slate-700 text-white hover:bg-slate-600 border border-slate-600" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
};

export default OwnershipHistoryModal;


