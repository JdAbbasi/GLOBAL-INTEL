
import React from 'react';
import type { ImporterSummary } from '../types';
import { BoxIcon, CalendarDaysIcon, MapPinIcon, PhoneIcon } from './icons';

interface ImporterSummaryCardProps {
  summary: ImporterSummary;
  onViewDetails: (name: string) => void;
}

export const ImporterSummaryCard: React.FC<ImporterSummaryCardProps> = ({ summary, onViewDetails }) => {
  return (
    <div className="relative bg-slate-800 border border-slate-700 rounded-lg group transition-all duration-300 hover:border-orange-500/30 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
            <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-100 group-hover:text-orange-400 transition-colors">{summary.importerName}</h2>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{summary.location}</span>
                </div>
            </div>
            <div className="flex-shrink-0 pt-1">
                <button
                  onClick={() => onViewDetails(summary.importerName)}
                  className="w-full sm:w-auto text-center bg-orange-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-orange-500 transition-colors text-sm"
                >
                  View Details
                </button>
            </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700 space-y-3 text-slate-300">
            <div className="flex items-start gap-3 text-sm">
                <BoxIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold mr-2 text-slate-400">Commodities:</span>
                    <span className="text-slate-200">{summary.primaryCommodities}</span>
                </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
                <CalendarDaysIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-semibold mr-2 text-slate-400">Last Shipment:</span>
                    <span className="text-slate-200">{summary.lastShipmentDate}</span>
                </div>
            </div>
            {summary.contactInformation && (
              <div className="flex items-start gap-3 text-sm">
                  <PhoneIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                      <span className="font-semibold mr-2 text-slate-400">Contact:</span>
                      <span className="text-slate-200">{summary.contactInformation}</span>
                  </div>
              </div>
            )}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/0 group-hover:from-orange-500/40 group-hover:via-orange-500/10 group-hover:to-orange-500/0 transition-all duration-500" />
    </div>
  );
};
