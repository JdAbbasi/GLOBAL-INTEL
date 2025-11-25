
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { searchImporters, fetchDetailedImporterData, searchSimilarImporters } from './services/geminiService';
import type { ImporterSummary, DetailedImporterResult, Subscription, Notification, ContactInfo } from './types';
import { ImporterCard } from './components/ImporterCard';
import { ImporterSummaryCard } from './components/ImporterSummaryCard';
import { Spinner } from './components/Spinner';
import { BellIcon } from './components/icons';
import { AlertModal } from './components/AlertModal';
import { NotificationPanel } from './components/NotificationPanel';
import { LeftSidebar } from './components/LeftSidebar';
import { DetailedViewModal } from './components/DetailedViewModal';

const logo = '/logo.png';

interface SearchFormProps {
    query: string;
    setQuery: (q: string) => void;
    city: string;
    setCity: (c: string) => void;
    state: string;
    setState: (s: string) => void;
    industry: string;
    setIndustry: (i: string) => void;
    isAdvancedOpen: boolean;
    setIsAdvancedOpen: (isOpen: boolean) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({ 
    query, setQuery, 
    city, setCity,
    state, setState,
    industry, setIndustry,
    isAdvancedOpen, setIsAdvancedOpen,
    onSubmit, isLoading 
}) => {
    // text-base on mobile prevents iOS zoom on focus, sm:text-sm for desktop
    const inputClass = "block w-full border border-slate-700 rounded-md leading-5 bg-slate-800 text-slate-300 placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 text-base sm:text-sm";
    
    return (
        <form onSubmit={onSubmit} className="w-full">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="For Importer detail write here, or use Advanced Search for specifics..."
                    className={`${inputClass} pl-10 pr-3 py-3`}
                    disabled={isLoading}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isLoading ? <Spinner /> : <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>}
                </div>
            </div>

            <div className="text-right mt-2">
                <button 
                    type="button" 
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="text-sm font-semibold text-orange-400 hover:text-orange-300 hover:underline transition-colors focus:outline-none"
                    aria-expanded={isAdvancedOpen}
                >
                    {isAdvancedOpen ? 'Hide Advanced Search' : 'Advanced Search'}
                </button>
            </div>

            {isAdvancedOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 animate-fade-in-down-card">
                    <div>
                        <label htmlFor="city" className="block text-xs font-medium text-slate-400 mb-1">City</label>
                        <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Miami" className={`${inputClass} px-3 py-2`} disabled={isLoading} />
                    </div>
                    <div>
                        <label htmlFor="state" className="block text-xs font-medium text-slate-400 mb-1">State</label>
                        <input id="state" type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g., Florida" className={`${inputClass} px-3 py-2`} disabled={isLoading} />
                    </div>
                    <div>
                        <label htmlFor="industry" className="block text-xs font-medium text-slate-400 mb-1">Industry / Keywords</label>
                        <input id="industry" type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., seafood, apparel" className={`${inputClass} px-3 py-2`} disabled={isLoading} />
                    </div>
                </div>
            )}
        </form>
    );
};


const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [industry, setIndustry] = useState<string>('');
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshingDetails, setIsRefreshingDetails] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [results, setResults] = useState<ImporterSummary[]>([]);
  const [similarResults, setSimilarResults] = useState<ImporterSummary[]>([]);
  
  const [selectedImporter, setSelectedImporter] = useState<DetailedImporterResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [alertCompanyName, setAlertCompanyName] = useState<string>('');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState<boolean>(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const hasRunInitialSearch = useRef(false);
  
  // Load state from localStorage
  useEffect(() => {
    try {
      const storedSubscriptions = localStorage.getItem('importerIntel-subscriptions');
      if (storedSubscriptions) setSubscriptions(JSON.parse(storedSubscriptions));
      const storedNotifications = localStorage.getItem('importerIntel-notifications');
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    } catch (e) {
      console.error("Failed to parse from localStorage", e);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('importerIntel-subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);
  useEffect(() => {
    localStorage.setItem('importerIntel-notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleOpenAlertModal = useCallback((name: string) => {
    setAlertCompanyName(name);
    setIsAlertModalOpen(true);
  }, []);

  const handleCloseAlertModal = useCallback(() => setIsAlertModalOpen(false), []);

  const handleSubscribe = useCallback((companyName: string, email: string) => {
    setSubscriptions(prev => {
        const newSubscriptions = [...prev, { companyName, email }];
        return Array.from(new Map(newSubscriptions.map(item => [item.companyName, item])).values());
    });
    setNotifications(prev => [
        { id: Date.now().toString(), message: `You are now subscribed to alerts for ${companyName}.`, timestamp: Date.now() },
        ...prev
    ]);
  }, []);
  
  const handleClearNotifications = useCallback(() => {
    setNotifications([]);
    setIsNotificationPanelOpen(false);
  }, []);

  const handleViewDetails = useCallback(async (importerName: string) => {
    const summary = [...results, ...similarResults].find(r => r.importerName === importerName);
    if (!summary) return;

    // Instantly create a partial object to render the modal's shell for better perceived performance
    const partialData: DetailedImporterResult = {
      parsedData: {
        importerName: summary.importerName,
        location: summary.location,
        lastShipmentDate: summary.lastShipmentDate,
        commodities: summary.primaryCommodities,
        // Mark other fields as "loading" by leaving them empty
        information: '',
        shipmentActivity: '',
        shipmentCounts: { lastMonth: '', lastQuarter: '', lastYear: '' },
        shipmentHistory: [],
        shipmentVolumeHistory: [],
        contact: { phone: '', website: '', email: '' },
        riskAssessment: { financialStability: '', regulatoryCompliance: '', geopoliticalRisk: '' },
        topTradePartners: [],
        topCommodityFlows: [],
      },
    };
    
    setSelectedImporter(partialData);
    setIsModalOpen(true);

    try {
      const fullData = await fetchDetailedImporterData(importerName);
      setSelectedImporter(current => {
        // Atomically update only if the user is still viewing the same importer card
        if (current && current.parsedData.importerName === importerName) {
            return fullData;
        }
        return current;
      });
    } catch (err: any) {
        console.error("Failed to fetch detailed data:", err);
        setError(err.message || 'An unexpected error occurred while fetching details.');
        // Update the card to show an error state
        setSelectedImporter(current => {
            if (current && current.parsedData.importerName === importerName) {
                return {
                    ...current,
                    parsedData: { ...current.parsedData, information: `Failed to load details: ${err.message}` }
                };
            }
            return current;
        });
    }
  }, [results, similarResults]);

  const handleRefreshDetails = useCallback(async (importerName: string) => {
    if (isRefreshingDetails) return;
    
    setIsRefreshingDetails(true);
    setError(null);

    try {
      const refreshedData = await fetchDetailedImporterData(importerName);
      setSelectedImporter(current => {
          // Only update if the user is still viewing the same importer
          if (current && current.parsedData.importerName === importerName) {
              return refreshedData;
          }
          return current;
      });
    } catch (err: any) {
        console.error("Failed to refresh detailed data:", err);
        setError(err.message || 'An unexpected error occurred while refreshing data.');
    } finally {
      setIsRefreshingDetails(false);
    }
  }, [isRefreshingDetails]);


  const triggerSearch = useCallback(async (searchParams: { query: string; city: string; state: string; industry: string; }) => {
    const { query, city, state, industry } = searchParams;
    if ((!query.trim() && !city.trim() && !state.trim() && !industry.trim()) || isLoading) return;
    
    setQuery(query);
    setIsLoading(true);
    setError(null);
    setResults([]);
    setSimilarResults([]);
    setSelectedImporter(null);
    setIsModalOpen(false);

    const similarSearchQuery = query.trim() || [industry, city, state].filter(Boolean).join(', ');

    try {
      const [mainResults, similarResults] = await Promise.allSettled([
        searchImporters({ query, city, state, industry }),
        searchSimilarImporters(similarSearchQuery)
      ]);
      
      if (mainResults.status === 'fulfilled') {
        setResults(mainResults.value);
      } else {
        console.error("Main search failed:", mainResults.reason);
        setError('Could not fetch main search results.');
      }

      if (similarResults.status === 'fulfilled') {
        setSimilarResults(similarResults.value);
      } else {
        console.error("Similar importers search failed:", similarResults.reason);
        // Don't set a main error for this, it's a secondary feature
      }

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Handle search from URL parameter on initial load
  useEffect(() => {
    if (hasRunInitialSearch.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    
    if (searchQuery) {
        hasRunInitialSearch.current = true;
        // Clean the URL to avoid re-triggering on refresh/back.
        const url = new URL(window.location.href);
        url.searchParams.delete('search');
        window.history.replaceState({}, '', url.toString());
        
        triggerSearch({ query: searchQuery, city: '', state: '', industry: '' });
    }
  }, [triggerSearch]);
  
  const handleSearchSimilar = useCallback((name: string) => {
    setIsModalOpen(false);
    // Reset advanced fields for a clean similar search
    setCity('');
    setState('');
    setIndustry('');
    setIsAdvancedSearchOpen(false);
    triggerSearch({ query: name, city: '', state: '', industry: '' });
  }, [triggerSearch]);


  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch({ query, city, state, industry });
  }, [query, city, state, industry, triggerSearch]);
  
  const handleExportCSV = useCallback(() => {
    if (!selectedImporter) return;

    const { parsedData } = selectedImporter;
    const headers = [
      'Importer Name', 'Location', 'Last Shipment Date', 'Information', 'Shipment Activity',
      'Phone', 'Email', 'Website', 'Address',
      'Shipments (Last Month)', 'Shipments (Last Quarter)', 'Shipments (Last Year)',
      'Volume History',
      'Financial Stability', 'Regulatory Compliance', 'Geopolitical Risk',
      'Top Trade Partners', 'Top Commodity Flows'
    ];

    const escapeCSV = (str: string | number | undefined | null) => {
        if (str === undefined || str === null) return '""';
        const stringValue = String(str);
        return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const contact = parsedData.contact;
    const phone = typeof contact === 'object' ? contact.phone : 'N/A';
    const email = typeof contact === 'object' ? contact.email : 'N/A';
    const website = typeof contact === 'object' ? contact.website : 'N/A';
    const address = typeof contact === 'object' ? contact.address : 'N/A';
    
    const volumeHistory = parsedData.shipmentVolumeHistory 
        ? parsedData.shipmentVolumeHistory.map(v => `${v.year}: ${v.volume} TEU`).join('; ')
        : '';

    const tradePartners = parsedData.topTradePartners.map(p => `${p.country} (${p.tradeVolume})`).join('; ');
    const commodityFlows = parsedData.topCommodityFlows.map(c => `${c.name} (${c.percentage})`).join('; ');

    const row = [
      escapeCSV(parsedData.importerName),
      escapeCSV(parsedData.location),
      escapeCSV(parsedData.lastShipmentDate),
      escapeCSV(parsedData.information),
      escapeCSV(parsedData.shipmentActivity),
      escapeCSV(phone),
      escapeCSV(email),
      escapeCSV(website),
      escapeCSV(address),
      escapeCSV(parsedData.shipmentCounts?.lastMonth),
      escapeCSV(parsedData.shipmentCounts?.lastQuarter),
      escapeCSV(parsedData.shipmentCounts?.lastYear),
      escapeCSV(volumeHistory),
      escapeCSV(parsedData.riskAssessment.financialStability),
      escapeCSV(parsedData.riskAssessment.regulatoryCompliance),
      escapeCSV(parsedData.riskAssessment.geopoliticalRisk),
      escapeCSV(tradePartners),
      escapeCSV(commodityFlows)
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + row.join(',');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${parsedData.importerName.replace(/\s+/g, '_')}_intel.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [selectedImporter]);

  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  const handleExportJSON = useCallback(() => {
    if (!selectedImporter) return;

    const { parsedData } = selectedImporter;
    const jsonContent = JSON.stringify(parsedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${parsedData.importerName.replace(/\s+/g, '_')}_intel.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedImporter]);

  const hasResults = results.length > 0 || similarResults.length > 0;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
        <div className="fixed top-4 right-4 z-50">
            <div className="relative">
                <button
                    ref={notificationButtonRef}
                    onClick={() => setIsNotificationPanelOpen(prev => !prev)}
                    className="p-2 rounded-full text-slate-400 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700 hover:text-orange-400 transition-colors" aria-label="View notifications">
                <BellIcon className="w-6 h-6" />
                {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-orange-500 ring-2 ring-slate-900" />
                )}
                </button>
                {isNotificationPanelOpen && (
                    <NotificationPanel
                        notifications={notifications}
                        onClose={() => setIsNotificationPanelOpen(false)}
                        onClearAll={handleClearNotifications}
                        parentRef={notificationButtonRef}
                    />
                )}
            </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <LeftSidebar />

            {/* Center Feed */}
            <main className="lg:col-span-9 py-6">
                
                {hasResults && (
                    <div className="mb-6">
                        <SearchForm 
                            query={query} setQuery={setQuery} 
                            city={city} setCity={setCity}
                            state={state} setState={setState}
                            industry={industry} setIndustry={setIndustry}
                            isAdvancedOpen={isAdvancedSearchOpen}
                            setIsAdvancedOpen={setIsAdvancedSearchOpen}
                            onSubmit={handleSearchSubmit} 
                            isLoading={isLoading} 
                        />
                    </div>
                )}
                
                {!hasResults ? (
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-15rem)]">
                        {isLoading && <Spinner />}
                        {error && <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center">{error}</div>}
                        {!isLoading && !error && (
                            <div className="text-center">
                                <h1 className="font-bold tracking-tight">
                                  <span className="text-orange-500 text-4xl sm:text-5xl md:text-6xl font-extrabold">Global</span>{" "}
                                  <span className="text-blue-500 text-4xl sm:text-5xl md:text-6xl font-extrabold">AI</span>{" "}
                                  <span className="text-white text-2xl sm:text-3xl md:text-4xl font-semibold">Importer Intel</span>
                                </h1>
                                <p className="mt-3 text-lg text-slate-400">
                                   Get Importers Digital Footsteps with the help of AI.
                                </p>
                                <div className="mt-8 max-w-lg mx-auto">
                                     <SearchForm 
                                        query={query} setQuery={setQuery} 
                                        city={city} setCity={setCity}
                                        state={state} setState={setState}
                                        industry={industry} setIndustry={setIndustry}
                                        isAdvancedOpen={isAdvancedSearchOpen}
                                        setIsAdvancedOpen={setIsAdvancedSearchOpen}
                                        onSubmit={handleSearchSubmit} 
                                        isLoading={isLoading} 
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {results.length > 0 && (
                             <div className="space-y-4">
                                {results.map((importer) => (
                                    <ImporterSummaryCard key={importer.importerName} summary={importer} onViewDetails={handleViewDetails} />
                                ))}
                            </div>
                        )}
                        
                        {similarResults.length > 0 && (
                            <div className="mt-12 space-y-4">
                                <h3 className="text-2xl font-bold text-slate-300 border-b border-slate-700 pb-3">Similar Importers</h3>
                                 {similarResults.map((importer) => (
                                    <ImporterSummaryCard key={importer.importerName} summary={importer} onViewDetails={handleViewDetails} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

        </div>
      </div>

      <footer className="text-center py-6 text-slate-600 text-sm">
          <p>Powered by JUNAID ABBASI. All data is for informational purposes only.</p>
      </footer>

      {isModalOpen && (
        <DetailedViewModal onClose={() => setIsModalOpen(false)}>
            {selectedImporter && (
                <ImporterCard 
                  data={selectedImporter.parsedData} 
                  onSubscribe={handleOpenAlertModal}
                  onExport={handleExportCSV}
                  onExportPDF={handleExportPDF}
                  onExportJSON={handleExportJSON}
                  onSearchSimilar={handleSearchSimilar}
                  onRefresh={handleRefreshDetails}
                  isRefreshing={isRefreshingDetails}
                />
            )}
        </DetailedViewModal>
      )}

      {isAlertModalOpen && (
        <AlertModal 
          companyName={alertCompanyName} 
          onClose={handleCloseAlertModal} 
          onSubscribe={handleSubscribe} 
          subscriptions={subscriptions}
        />
      )}
    </div>
  );
};

export default App;
