
import React from 'react';
import type { Source } from '../types';
import { LinkIcon } from './icons';

interface SourceLinkProps {
  source: Source;
}

export const SourceLink: React.FC<SourceLinkProps> = ({ source }) => {
  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-slate-800 p-4 rounded-lg border border-slate-700 hover:bg-slate-700/50 hover:border-orange-500 transition-all duration-300 group"
    >
      <div className="flex items-start gap-3">
        <LinkIcon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0 group-hover:text-orange-400 transition-colors" />
        <div>
            <p className="font-semibold text-slate-200 group-hover:text-orange-300 transition-colors line-clamp-2">
                {source.title}
            </p>
            <p className="text-xs text-slate-500 truncate group-hover:text-slate-400 transition-colors">
                {source.uri}
            </p>
        </div>
      </div>
    </a>
  );
};