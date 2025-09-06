import React from 'react';
import type { WatchlistItem } from '../types';
import { formatTenderDate, calculateRemainingDays, getRemainingDaysInfo, getStatusColors } from '../utils';
import { CancelIcon } from './icons';

type TenderDetailsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onManage: (item: WatchlistItem) => void;
  item: WatchlistItem;
};

const TenderDetailsModal: React.FC<TenderDetailsModalProps> = ({ isOpen, onClose, onManage, item }) => {
  if (!isOpen) return null;
  
  const statusColors = getStatusColors(item.status);
  const remainingDays = calculateRemainingDays(item.tender.closingDate);
  const remainingDaysInfo = getRemainingDaysInfo(remainingDays);

  return (
    <div 
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-lg border border-slate-700 relative"
        onClick={e => e.stopPropagation()}
      >
         <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
             <CancelIcon className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-bold text-white mb-4 pr-8">{item.tender.title}</h2>
        
        <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Status:</span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors.bg} ${statusColors.text}`}>
                    {item.status}
                </span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Closing Date:</span>
                <span className="font-semibold text-slate-200">{formatTenderDate(item.tender.closingDate)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Time Remaining:</span>
                <span className={`font-semibold ${remainingDaysInfo.textColor}`}>{remainingDaysInfo.text}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Source:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[200px]">{item.tender.source}</span>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-700/50">
            <button type="button" onClick={onClose} className="btn-secondary">
              Close
            </button>
            <button 
                type="button" 
                onClick={() => onManage(item)} 
                className="btn-primary">
              Go to Workspace
            </button>
        </div>
      </div>
    </div>
  );
};

export default TenderDetailsModal;
