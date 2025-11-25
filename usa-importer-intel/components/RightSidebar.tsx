import React from 'react';
import { LinkIcon } from './icons';
import { Source } from '../types';
import { SourceLink } from './SourceLink';

interface RightSidebarProps {
  sources: Source[];
}

const SourcesSection: React.FC<{ sources: Source[] }> = ({ sources }) => {
    if (sources.length === 0) return null;

    return (
        <div>
            <h3 className="text-lg font-bold mb-4 text-slate-200 flex items-center gap-3">
                <LinkIcon className="w-6 h-6 text-orange-400" />
                Sources
            </h3>
            <div className="space-y-3">
                {sources.map((source, index) => (
                    <SourceLink key={index} source={source} />
                ))}
            </div>
        </div>
    );
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ sources }) => (
    <aside className="hidden lg:block lg:col-span-2 xl:col-span-3 py-6">
        <div className="sticky top-20 space-y-8">
            <SourcesSection sources={sources} />
        </div>
    </aside>
);