
import React, { useEffect, useRef } from 'react';
import type { Notification } from '../types';
import { BellIcon } from './icons';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onClearAll: () => void;
  parentRef: React.RefObject<HTMLButtonElement>;
}

const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
};

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ notifications, onClose, onClearAll, parentRef }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        parentRef.current &&
        !parentRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, parentRef]);


  return (
    <div
      ref={panelRef}
      className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-50 transform opacity-0 animate-fade-in-down mx-4 sm:mx-0"
    >
      <div className="flex justify-between items-center p-3 border-b border-slate-700">
        <h3 className="font-bold text-white text-lg">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-orange-400 hover:text-orange-300 hover:underline"
          >
            Clear All
          </button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-12 px-4">
            <BellIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold">No new notifications</p>
            <p className="text-sm text-slate-500">Subscribe to companies to get alerts here.</p>
          </div>
        ) : (
          <ul>
            {notifications.map((notification, index) => (
              <li key={notification.id} className={`p-4 border-b border-slate-700/50 ${index === 0 ? 'bg-orange-900/20' : ''}`}>
                <p className="text-slate-200">{notification.message}</p>
                <p className="text-xs text-slate-500 mt-1">{formatTimeAgo(notification.timestamp)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
      <style>{`
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
            animation: fadeInDown 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
