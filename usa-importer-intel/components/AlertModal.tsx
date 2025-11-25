import React, { useState, useCallback, useMemo } from 'react';
import type { Subscription } from '../types';
import { BellIcon, CloseIcon, CheckCircleIcon } from './icons';

interface AlertModalProps {
  companyName: string;
  onClose: () => void;
  onSubscribe: (companyName: string, email: string) => void;
  subscriptions: Subscription[];
}

export const AlertModal: React.FC<AlertModalProps> = ({ companyName, onClose, onSubscribe, subscriptions }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isAlreadySubscribed = useMemo(() => {
    return subscriptions.some(sub => sub.companyName === companyName);
  }, [subscriptions, companyName]);
  
  const subscribedEmail = useMemo(() => {
    if (!isAlreadySubscribed) return '';
    return subscriptions.find(sub => sub.companyName === companyName)?.email || '';
  }, [subscriptions, companyName, isAlreadySubscribed]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      onSubscribe(companyName, email);
      setIsSubmitted(true);
    }
  }, [email, companyName, onSubscribe]);
  
  const showSuccessState = isSubmitted || isAlreadySubscribed;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-opacity duration-300"
      aria-labelledby="alert-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg w-full max-w-md relative p-6 sm:p-8 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${showSuccessState ? 'bg-green-900/50' : 'bg-orange-900/50'}`}>
             {showSuccessState ? <CheckCircleIcon className="w-6 h-6 text-green-400" /> : <BellIcon className="w-6 h-6 text-orange-400" />}
          </div>
          <h2 id="alert-modal-title" className="text-2xl font-bold text-white">
            {showSuccessState ? 'Subscription Active' : 'Subscribe to Alerts'}
          </h2>
        </div>

        {showSuccessState ? (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-green-400 mb-2">
                {isAlreadySubscribed && !isSubmitted ? 'Already Subscribed!' : 'Subscription Confirmed!'}
            </h3>
            <p className="text-slate-300">
              You will receive email notifications for <span className="font-bold text-white">{companyName}</span> at {subscribedEmail || email}.
            </p>
            <button
                onClick={onClose}
                className="mt-6 w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-500 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800"
            >
                Done
            </button>
          </div>
        ) : (
          <div>
            <p className="text-slate-400 mb-6">
              Get real-time email notifications for new trade activities related to <span className="font-semibold text-orange-300">{companyName}</span>.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-orange-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                disabled={!email.trim() || !email.includes('@')}
              >
                Subscribe
              </button>
            </form>
          </div>
        )}
      </div>
       <style>{`
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