import React, { useEffect, useRef } from 'react';
import { CloseIcon } from './icons';

interface DetailedViewModalProps {
  onClose: () => void;
  children: React.ReactNode;
}

export const DetailedViewModal: React.FC<DetailedViewModalProps> = ({ onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousedown', handleClickOutside);
    
    // Prevent background scrolling
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-start z-50 p-4 transition-opacity duration-300 animate-fade-in printable-modal-wrapper"
      role="dialog"
      aria-modal="true"
    >
      <div 
        ref={modalRef}
        className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg w-full max-w-4xl relative mt-12 mb-8 max-h-[calc(100vh-6rem)] overflow-y-auto transform transition-all duration-300 animate-fade-in-scale printable-content-container"
      >
        <button
          onClick={onClose}
          className="sticky top-0 right-0 z-10 float-right m-2 p-2 rounded-full text-slate-400 bg-slate-800/50 hover:bg-slate-700 hover:text-white transition-colors no-print"
          aria-label="Close modal"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        {children}
      </div>
       <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes fadeInScale {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in-scale {
          animation: fadeInScale 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};