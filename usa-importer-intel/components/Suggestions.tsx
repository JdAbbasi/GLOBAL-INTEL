import React from 'react';
import { Spinner } from './Spinner';
import { UsersIcon, SearchIcon } from './icons';

interface SuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (name: string) => void;
  isLoading: boolean;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ suggestions, onSuggestionClick, isLoading }) => {
  if (isLoading) {
    return (
      <div className="mt-12 text-center">
        <p className="text-lg text-slate-400 mb-4">Finding similar importers...</p>
        <Spinner />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 text-slate-200 flex items-center gap-3">
         <UsersIcon className="w-6 h-6 text-orange-400" />
         You might also be interested in...
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((name, index) => (
          <div 
            key={index} 
            className="bg-slate-800 p-4 rounded-lg border border-slate-700 group flex justify-between items-center transition-all duration-200 hover:border-orange-500 hover:bg-slate-700/50"
          >
            <p className="font-semibold text-slate-300 group-hover:text-white transition-colors">{name}</p>
            <button
              onClick={() => onSuggestionClick(name)}
              className="bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-lg hover:bg-orange-600 hover:text-white transition-colors text-sm flex items-center gap-2 group-hover:bg-orange-600 group-hover:text-white"
              aria-label={`Search for ${name}`}
            >
              <SearchIcon className="w-4 h-4" />
              <span>Search</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};