
import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import type { ParsedImporterData, RiskAssessment, TradePartner, CommodityFlow, ContactInfo, ImporterSummary, ShipmentEvent, ShipmentVolume, ShipmentCounts } from '../types';
import { InfoIcon, ShipIcon, PhoneIcon, BellIcon, ShieldCheckIcon, CheckCircleIcon, ArrowDownTrayIcon, UsersIcon, ChevronDownIcon, SearchIcon, ArrowUpTrayIcon, EnvelopeIcon, ClipboardIcon, MapPinIcon, CalendarDaysIcon, GlobeIcon, ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon, BoxIcon, DocumentTextIcon, ArrowPathIcon, FunnelIcon, ArrowsUpDownIcon, CodeBracketIcon, PrinterIcon } from './icons';
import { searchSimilarImporters } from '../services/geminiService';
import { Spinner } from './Spinner';
import { WorldMap } from './WorldMap';

interface ImporterCardProps {
  data: ParsedImporterData;
  onSubscribe: (name: string) => void;
  onExport: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onSearchSimilar: (name: string) => void;
  onRefresh: (name: string) => void;
  isRefreshing?: boolean;
}

const SkeletonLoader: React.FC<{ className?: string; count?: number }> = ({ className, count = 1 }) => (
    <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className={`animate-pulse bg-slate-700 rounded ${className || 'h-4 w-full'}`} />
        ))}
    </div>
);

const ContactForm: React.FC = () => {
    const MAX_MESSAGE_LENGTH = 500;
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<{ email?: string; message?: string }>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validate = () => {
        const newErrors: { email?: string; message?: string } = {};
        if (!email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Please enter a valid email address.';
        }
        
        if (!message.trim()) {
             newErrors.message = 'Message is required.';
        } else if (message.trim().length < 10) {
            newErrors.message = 'Message must be at least 10 characters long.';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEmailBlur = () => {
        if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate() && !isSubmitting) {
            setIsSubmitting(true);
            // Simulate API call
            setTimeout(() => {
                setIsSubmitted(true);
                setIsSubmitting(false);
                setErrors({});
            }, 1500);
        }
    };
    
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
    };

    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        if (errors.message) setErrors(prev => ({ ...prev, message: undefined }));
    };

    if (isSubmitted) {
        return (
            <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-green-500/30 animate-fade-in">
                <div className="inline-flex items-center justify-center p-3 bg-green-500/20 rounded-full mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Inquiry Sent Successfully</h3>
                <p className="text-slate-300">
                    Thank you for reaching out. We have sent a confirmation to <span className="text-white font-medium">{email}</span> and the importer will be in touch shortly.
                </p>
                <button 
                    onClick={() => { setIsSubmitted(false); setEmail(''); setMessage(''); }}
                    className="mt-6 text-sm text-orange-400 hover:text-orange-300 underline"
                >
                    Send another message
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Email Address <span className="text-red-400">*</span>
                </label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`w-full px-4 py-2.5 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'}`}
                    placeholder="name@company.com"
                    disabled={isSubmitting}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1"><span>•</span>{errors.email}</p>}
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Message <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                    <textarea
                        id="message"
                        rows={5}
                        value={message}
                        onChange={handleMessageChange}
                        className={`w-full px-4 py-3 bg-slate-900/50 border rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none ${errors.message ? 'border-red-500 focus:ring-red-500' : 'border-slate-600'}`}
                        placeholder="I am interested in your products..."
                        disabled={isSubmitting}
                        maxLength={MAX_MESSAGE_LENGTH}
                    />
                    <div className={`absolute bottom-3 right-3 text-xs ${message.length >= MAX_MESSAGE_LENGTH ? 'text-red-400 font-bold' : 'text-slate-500'}`}>
                        {message.length} / {MAX_MESSAGE_LENGTH}
                    </div>
                </div>
                {errors.message && <p className="text-red-400 text-xs mt-1 ml-1 flex items-center gap-1"><span>•</span>{errors.message}</p>}
            </div>
            <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg shadow-orange-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Spinner />
                        <span>Sending Inquiry...</span>
                    </>
                ) : (
                    <>
                        <EnvelopeIcon className="w-5 h-5" />
                        <span>Send Inquiry</span>
                    </>
                )}
            </button>
        </form>
    );
};

const getRiskLevel = (text: string): { level: 'Low' | 'Medium' | 'High' | 'Unknown'; color: string; bgColor: string; } => {
    const lowerText = text.toLowerCase();
    if (/\b(high|strong|good|stable|compliant|low risk)\b/.test(lowerText)) {
        return { level: 'Low', color: 'text-green-300', bgColor: 'bg-green-500/20' };
    }
    if (/\b(medium|moderate|some concern|monitored|adequate)\b/.test(lowerText)) {
        return { level: 'Medium', color: 'text-yellow-300', bgColor: 'bg-yellow-500/20' };
    }
    if (/\b(low|poor|unstable|violation|sanction|high risk|negative)\b/.test(lowerText)) {
        return { level: 'High', color: 'text-red-300', bgColor: 'bg-red-500/20' };
    }
    return { level: 'Unknown', color: 'text-slate-400', bgColor: 'bg-slate-600/50' };
};


const RiskAssessmentSection: React.FC<{ assessment: RiskAssessment }> = ({ assessment }) => {
    const riskItems = [
        { title: "Financial Stability", content: assessment.financialStability },
        { title: "Regulatory Compliance", content: assessment.regulatoryCompliance },
        { title: "Geopolitical Risk", content: assessment.geopoliticalRisk }
    ];

    return (
        <div className="space-y-4">
            {riskItems.map(item => {
                const { level, color, bgColor } = getRiskLevel(item.content);
                return (
                    <div key={item.title} className="p-4 rounded-lg bg-slate-900/50">
                        <div className="flex items-center gap-3 mb-2">
                             <h4 className="text-lg font-semibold text-slate-300">{item.title}</h4>
                             <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${bgColor} ${color} risk-badge`}>{level} Risk</span>
                        </div>
                        <p className="text-slate-400 whitespace-pre-wrap">{item.content}</p>
                    </div>
                );
            })}
        </div>
    );
};

const ShipmentStats: React.FC<{ counts: ShipmentCounts }> = ({ counts }) => {
    const stats = [
        { label: 'Last Month', value: counts.lastMonth },
        { label: 'Last Quarter', value: counts.lastQuarter },
        { label: 'Last Year', value: counts.lastYear },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {stats.map(stat => (
                <div key={stat.label} className="bg-slate-900/50 p-4 rounded-lg text-center shipment-stat-card">
                    <p className="text-sm font-semibold text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-orange-400 mt-1">
                        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </p>
                    <p className="text-xs text-slate-500">Shipments</p>
                </div>
            ))}
        </div>
    );
};

const ShipmentVolumeChart: React.FC<{ history: ShipmentVolume[] }> = ({ history }) => {
    const [tooltipData, setTooltipData] = useState<{ year: number; volume: number; x: number; y: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    if (!history || history.length < 2) {
        return <div className="text-slate-500 italic">Not enough annual volume data to display a chart.</div>;
    }
    
    // Sort data just in case it's not
    const sortedHistory = [...history].sort((a, b) => a.year - b.year);

    const width = 500;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 30, left: 60 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVolume = Math.max(...sortedHistory.map(h => h.volume), 0) * 1.1; // Add 10% headroom

    const yScale = (volume: number) => {
        return padding.top + chartHeight - (volume / maxVolume) * chartHeight;
    };
    
    const y0 = yScale(0); // Baseline y-coordinate

    // Bar configuration
    const slotWidth = chartWidth / sortedHistory.length;
    const barWidth = Math.min(40, slotWidth * 0.6);
    
    const getX = (index: number) => {
        return padding.left + (slotWidth * index) + (slotWidth - barWidth) / 2;
    };

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const mouseX = event.clientX - svgRect.left;

        // Check if mouse is within chart area horizontally
        if (mouseX < padding.left || mouseX > width - padding.right) {
            setTooltipData(null);
            return;
        }

        // Find the index of the slot the mouse is currently in
        const relativeX = mouseX - padding.left;
        const index = Math.floor(relativeX / slotWidth);

        if (index >= 0 && index < sortedHistory.length) {
            const d = sortedHistory[index];
            const barCenterX = getX(index) + barWidth / 2;
            
            setTooltipData({
                year: d.year,
                volume: d.volume,
                x: barCenterX,
                y: yScale(d.volume),
            });
        } else {
            setTooltipData(null);
        }
    };

    const handleMouseLeave = () => {
        setTooltipData(null);
    };

    const formatYAxisLabel = (value: number) => {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k`;
        }
        return value.toString();
    }
    
    const yAxisTicks = useMemo(() => {
        if (maxVolume === 0) return [];
        const tickCount = 4;
        const ticks = [];
        const step = maxVolume / tickCount;
        for (let i = 0; i <= tickCount; i++) {
            ticks.push(Math.round(i * step));
        }
        return ticks;
    }, [maxVolume]);

    return (
        <div className="bg-slate-900/50 p-4 rounded-lg mb-4">
            <h4 className="text-lg font-semibold text-slate-300 mb-4">Annual Shipment Volume (TEUs)</h4>
            <div className="relative">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${width} ${height}`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="w-full h-auto cursor-crosshair"
                >
                    {/* Y-axis grid lines and labels */}
                    {yAxisTicks.map((tick, i) => (
                        <g key={i} className="text-slate-500">
                            <line
                                x1={padding.left}
                                x2={width - padding.right}
                                y1={yScale(tick)}
                                y2={yScale(tick)}
                                stroke="currentColor"
                                strokeWidth="0.5"
                                strokeDasharray="3,3"
                            />
                            <text
                                x={padding.left - 10}
                                y={yScale(tick)}
                                textAnchor="end"
                                alignmentBaseline="middle"
                                fontSize="10"
                                fill="currentColor"
                            >
                                {formatYAxisLabel(tick)}
                            </text>
                        </g>
                    ))}

                    {/* Bars */}
                    {sortedHistory.map((d, i) => {
                         const barHeight = y0 - yScale(d.volume);
                         return (
                            <rect
                                key={i}
                                x={getX(i)}
                                y={yScale(d.volume)}
                                width={barWidth}
                                height={barHeight}
                                fill="#f97316"
                                className="hover:opacity-80 transition-opacity duration-200 animate-grow-bar"
                                style={{ transformOrigin: `center ${y0}px` }}
                            />
                         );
                    })}

                    {/* X-axis labels */}
                    {sortedHistory.map((d, i) => (
                        <text
                            key={i}
                            x={getX(i) + barWidth / 2}
                            y={height - padding.bottom + 15}
                            textAnchor="middle"
                            fontSize="10"
                            fill="currentColor"
                            className="text-slate-400 font-mono"
                        >
                            {d.year}
                        </text>
                    ))}
                    
                    {/* Tooltip Indicator */}
                    {tooltipData && (
                         <circle
                            cx={tooltipData.x}
                            cy={tooltipData.y}
                            r="4"
                            fill="#fff"
                            stroke="#f97316"
                            strokeWidth="2"
                            pointerEvents="none"
                        />
                    )}
                </svg>

                {/* HTML Tooltip */}
                {tooltipData && (
                    <div
                        className="absolute bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-md pointer-events-none shadow-lg transition-transform duration-100 z-10"
                        style={{
                            left: `${tooltipData.x / width * 100}%`,
                            top: `${tooltipData.y / height * 100}%`,
                            transform: `translate(-50%, -120%)`
                        }}
                    >
                        <div className="font-mono text-base">{tooltipData.volume.toLocaleString()} <span className="text-xs text-slate-300">TEUs</span></div>
                        <div className="text-slate-400">{tooltipData.year}</div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-700"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
    if (!data || data.length < 2) {
        return null;
    }

    const width = 100;
    const height = 25;
    const stroke = "#f97316"; // orange-500
    const strokeWidth = 1.5;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;

    const points = data
        .map((d, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((d - min) / range) * (height - strokeWidth * 2) + strokeWidth;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        })
        .join(' ');

    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
            <polyline
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

const TrendIcon: React.FC<{ trend: string }> = ({ trend }) => {
    const lowerTrend = trend.toLowerCase();
    if (lowerTrend.includes('increasing')) return <ArrowTrendingUpIcon className="w-5 h-5 text-green-400" />;
    if (lowerTrend.includes('decreasing')) return <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />;
    if (lowerTrend.includes('stable')) return <MinusIcon className="w-5 h-5 text-yellow-400" />;
    return null;
};

const CommodityDetailsList: React.FC<{ commodities: CommodityFlow[] }> = ({ commodities }) => {
    if (!commodities || commodities.length === 0) {
        return <div className="text-slate-400 text-center py-8 bg-slate-900/50 rounded-lg">No commodity data available.</div>;
    }

    return (
        <div className="grid md:grid-cols-2 gap-4">
            {commodities.map((commodity, index) => (
                <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-transparent hover:border-orange-500/50 transition-all duration-300 flex flex-col justify-between transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-900/30">
                    <div>
                        <div className="flex justify-between items-start">
                            <h4 className="text-lg font-bold text-slate-200">{commodity.name}</h4>
                            <span className="text-lg font-mono font-bold text-orange-400">{commodity.percentage}</span>
                        </div>
                        <div className="mt-4 space-y-3 text-sm">
                            {commodity.averagePrice && commodity.averagePrice !== 'N/A' && (
                                <div className="flex items-center gap-3 text-slate-300">
                                    <span className="text-slate-500 font-semibold w-24">Avg. Price:</span>
                                    <span>{commodity.averagePrice}</span>
                                </div>
                            )}
                            {commodity.marketTrend && commodity.marketTrend !== 'N/A' && (
                                <div className="flex items-start gap-3 text-slate-300">
                                    <span className="text-slate-500 font-semibold w-24">Market Trend:</span>
                                    <div className="flex items-center gap-2">
                                        <TrendIcon trend={commodity.marketTrend} />
                                        <span className="flex-1">{commodity.marketTrend}</span>
                                    </div>
                                </div>
                            )}
                            {commodity.topSupplier && commodity.topSupplier !== 'N/A' && (
                                <div className="flex items-center gap-3 text-slate-300">
                                    <span className="text-slate-500 font-semibold w-24">Top Supplier:</span>
                                    <span>{commodity.topSupplier}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    {commodity.importVolumeTrendData && commodity.importVolumeTrendData.length > 1 && (
                         <div className="mt-4 pt-4 border-t border-slate-700/50">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-slate-400">Recent Import Trend</span>
                                <Sparkline data={commodity.importVolumeTrendData} />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};


const formatContactNode = (contact: ContactInfo | string): React.ReactNode => {
    if (typeof contact === 'string') {
        return <p>{contact}</p>;
    }
    if (typeof contact === 'object' && contact !== null) {
        const hasPhone = contact.phone && contact.phone.toLowerCase() !== 'not publicly available' && contact.phone !== 'N/A';
        const hasWebsite = contact.website && contact.website.toLowerCase() !== 'not publicly available' && contact.website !== 'N/A';
        const hasEmail = contact.email && contact.email.toLowerCase() !== 'not publicly available' && contact.email !== 'N/A';
        const hasAddress = contact.address && contact.address.toLowerCase() !== 'not publicly available' && contact.address !== 'N/A';

        const suggestionNode = (
            <span className="text-slate-500 italic text-sm">
                Not publicly available. Inquire via the 'Contact Importer' form below.
            </span>
        );

        if (!hasPhone && !hasWebsite && !hasEmail && !hasAddress) {
            return (
                <p className="text-slate-500 italic text-sm">
                    Contact details are not publicly listed. You can try to inquire using the 'Contact Importer' form below.
                </p>
            );
        }

        return (
            <div className="space-y-3">
                 {hasAddress && (
                    <div className="flex items-start gap-3">
                        <MapPinIcon className="w-5 h-5 mt-0.5 flex-shrink-0 text-slate-400" />
                        <span className="break-words">{contact.address}</span>
                    </div>
                )}
                <div className="flex items-start gap-3">
                    <PhoneIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasPhone ? 'text-slate-400' : 'text-slate-600'}`} />
                    {hasPhone ? (
                        <span className="break-all">{contact.phone}</span>
                    ) : (
                        suggestionNode
                    )}
                </div>
                <div className="flex items-start gap-3">
                    <EnvelopeIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasEmail ? 'text-slate-400' : 'text-slate-600'}`} />
                    {hasEmail ? (
                        <a href={`mailto:${contact.email}`} className="text-orange-400 hover:underline break-all">
                            {contact.email}
                        </a>
                    ) : (
                        suggestionNode
                    )}
                </div>
                <div className="flex items-start gap-3">
                    <GlobeIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${hasWebsite ? 'text-slate-400' : 'text-slate-600'}`} />
                    {hasWebsite ? (
                        <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline break-all">
                            {contact.website}
                        </a>
                    ) : (
                        suggestionNode
                    )}
                </div>
            </div>
        );
    }
    return <p>Contact details unavailable</p>;
};

const SimilarImportersSection: React.FC<{ importerName: string, onSearch: (name: string) => void, onSubscribe: (name: string) => void }> = ({ importerName, onSearch, onSubscribe }) => {
    const [importers, setImporters] = useState<ImporterSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSimilar = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const results = await searchSimilarImporters(importerName);
                setImporters(results);
            } catch (err) {
                console.error("Failed to fetch similar importers", err);
                setError("Could not load similar importers.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSimilar();
    }, [importerName]);
    
    if (isLoading) {
        return <div className="p-4 text-center"><Spinner /></div>;
    }
    
    if (error) {
        return <div className="p-4 text-center text-red-400">{error}</div>;
    }

    if (importers.length === 0) {
        return <p className="text-slate-400">No similar importers found.</p>;
    }

    return (
        <div className="space-y-3">
            {importers.map((importer, index) => (
                <div 
                    key={index}
                    className="bg-slate-900/50 p-3 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3 group transition-all duration-300"
                >
                    <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => onSearch(importer.importerName)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSearch(importer.importerName)}
                        aria-label={`View details for ${importer.importerName}`}
                    >
                        <p className="font-semibold text-slate-200 group-hover:text-orange-300">{importer.importerName}</p>
                        <p className="text-sm text-slate-400">{importer.location}</p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                         <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSubscribe(importer.importerName);
                            }}
                            className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                            aria-label={`Subscribe to alerts for ${importer.importerName}`}
                        >
                            <BellIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => onSearch(importer.importerName)}
                            className="bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors text-sm flex items-center gap-2"
                            aria-label={`View details for ${importer.importerName}`}
                        >
                            <SearchIcon className="w-4 h-4" />
                            <span>View</span>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ImportHistory: React.FC<{ history: ShipmentEvent[] }> = ({ history }) => {
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [filterText, setFilterText] = useState('');

    if (!history || history.length === 0) {
        return <div className="text-slate-500 italic mt-4">No specific import events available.</div>;
    }

    const parseShipmentEvent = (eventText: string) => {
        const text = eventText.replace(/\.$/, '');

        // Enhanced regex patterns
        const volumeRegex = /(\d[\d,.]*\s*(?:TEUs?|containers?|units?|kgs?|kg|tons?|ton|lbs?|packages?|shipments?|cartons?|pieces?))/i;
        const originRegex = /(?:from|originating from|originating in)\s+([A-Z][a-zA-Z\s,.-]+?)(?=\s+(?:containing|of|consisting|by|supplier|via)|\.|$)/i;
        const commodityRegex = /(?:of|containing|consisting of)\s+([a-zA-Z0-9\s,()-]+?)(?=\s+(?:from|via|originating|by|supplier)|\.|$)/i;
        const supplierRegex = /(?:supplier|by|manufactured by)\s+([A-Z][a-zA-Z0-9\s,.]+?)(?=\s+(?:via|from|of)|\.|$)/i;

        const volumeMatch = text.match(volumeRegex);
        const originMatch = text.match(originRegex);
        const commodityMatch = text.match(commodityRegex);
        const supplierMatch = text.match(supplierRegex);

        return {
            volume: volumeMatch ? volumeMatch[1].trim() : null,
            origin: originMatch ? originMatch[1].trim() : null,
            commodity: commodityMatch ? commodityMatch[1].trim() : null,
            supplier: supplierMatch ? supplierMatch[1].trim() : null,
        };
    };

    const processedHistory = useMemo(() => {
        let data = [...history];

        if (filterText.trim()) {
            const lower = filterText.toLowerCase().trim();
            data = data.filter(item => 
                item.event.toLowerCase().includes(lower) || 
                item.date.includes(lower)
            );
        }

        data.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            const timeA = isNaN(dateA) ? 0 : dateA;
            const timeB = isNaN(dateB) ? 0 : dateB;
            
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return data;
    }, [history, filterText, sortOrder]);

    return (
        <div className="mt-6">
             <div className="flex flex-col sm:flex-row gap-4 mb-6">
                 {/* Search Input */}
                 <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        className="bg-slate-900/50 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 p-2.5 placeholder-slate-500 transition-all focus:bg-slate-800"
                        placeholder="Filter by keyword, commodity, or origin..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                 </div>
                 {/* Sort Button */}
                 <button
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    className="flex items-center justify-center gap-2 bg-slate-900/50 border border-slate-700 text-slate-300 hover:text-orange-400 hover:border-orange-500 hover:bg-slate-800 font-medium rounded-lg text-sm px-4 py-2 transition-all w-full sm:w-auto min-w-[160px]"
                 >
                    <ArrowsUpDownIcon className="w-4 h-4" />
                    <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
                 </button>
            </div>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-4">
                {processedHistory.map((item, index) => {
                    const { volume, origin, commodity, supplier } = parseShipmentEvent(item.event);
                    return (
                        <div key={index} className="bg-slate-900/50 p-5 rounded-lg border border-slate-700/50 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-900/10 group flex flex-col">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-sm font-semibold text-orange-400 flex items-center gap-2 bg-orange-900/20 px-2 py-1 rounded">
                                    <CalendarDaysIcon className="w-4 h-4" />
                                    {item.date}
                                </p>
                            </div>
                            
                            <div className="flex-1">
                                 <div className="space-y-2.5 text-sm">
                                    {commodity ? (
                                        <div className="flex items-start justify-between border-b border-slate-800/50 pb-2">
                                            <span className="text-slate-500 flex items-center gap-2"><BoxIcon className="w-4 h-4" /> Commodity</span>
                                            <span className="text-slate-200 font-medium text-right pl-4">{commodity}</span>
                                        </div>
                                    ) : (
                                         <div className="flex items-start gap-2 text-slate-400 italic pb-2 border-b border-slate-800/50">
                                            <BoxIcon className="w-4 h-4 mt-0.5" />
                                            <span>{item.event}</span>
                                         </div>
                                    )}

                                    {origin && (
                                        <div className="flex items-start justify-between">
                                            <span className="text-slate-500 flex items-center gap-2"><GlobeIcon className="w-4 h-4" /> Origin</span>
                                            <span className="text-slate-300 text-right pl-4">{origin}</span>
                                        </div>
                                    )}
                                    {volume && (
                                        <div className="flex items-start justify-between">
                                            <span className="text-slate-500 flex items-center gap-2"><ChartBarIcon className="w-4 h-4" /> Volume</span>
                                            <span className="text-slate-300 text-right pl-4">{volume}</span>
                                        </div>
                                    )}
                                    {supplier && (
                                        <div className="flex items-start justify-between">
                                            <span className="text-slate-500 flex items-center gap-2"><UsersIcon className="w-4 h-4" /> Supplier</span>
                                            <span className="text-slate-300 text-right pl-4">{supplier}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
             {processedHistory.length === 0 && (
                <div className="text-center py-12 text-slate-500 bg-slate-900/20 rounded-lg border border-slate-800 border-dashed">
                    <FunnelIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>No shipment events match your filter.</p>
                    <button 
                        onClick={() => setFilterText('')}
                        className="text-orange-400 hover:underline text-sm mt-2"
                    >
                        Clear filter
                    </button>
                </div>
            )}
        </div>
    );
};

const Section: React.FC<{icon: React.ReactNode, title: string, children: React.ReactNode}> = ({icon, title, children}) => (
    <div>
        <div className="flex items-center gap-3 mb-4">
            {icon}
            <h3 className="text-xl font-bold text-slate-200">{title}</h3>
        </div>
        {children}
    </div>
);


export const ImporterCard: React.FC<ImporterCardProps> = ({ data, onSubscribe, onExport, onExportPDF, onExportJSON, onSearchSimilar, onRefresh, isRefreshing }) => {
    const [isContactFormVisible, setIsContactFormVisible] = useState(false);
    const [isSimilarVisible, setIsSimilarVisible] = useState(false);
    const { importerName } = data;

    const isLoading = !data.information;

    const [isShareOpen, setIsShareOpen] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copy Link');
    const shareButtonRef = useRef<HTMLButtonElement>(null);
    const shareDropdownRef = useRef<HTMLDivElement>(null);

    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportButtonRef = useRef<HTMLButtonElement>(null);
    const exportDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                shareDropdownRef.current &&
                !shareDropdownRef.current.contains(event.target as Node) &&
                shareButtonRef.current &&
                !shareButtonRef.current.contains(event.target as Node)
            ) {
                setIsShareOpen(false);
            }
            if (
                exportDropdownRef.current &&
                !exportDropdownRef.current.contains(event.target as Node) &&
                exportButtonRef.current &&
                !exportButtonRef.current.contains(event.target as Node)
            ) {
                setIsExportOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCopyLink = () => {
        const shareableLink = `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(data.importerName)}`;
        navigator.clipboard.writeText(shareableLink).then(() => {
            setCopyStatus('Copied!');
            setTimeout(() => {
                setCopyStatus('Copy Link');
                setIsShareOpen(false);
            }, 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            setCopyStatus('Failed!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        });
    };

    const shareableLink = `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(data.importerName)}`;
    const subject = `Importer Intel: ${data.importerName}`;
    const body = `Check out this importer profile for ${data.importerName} on Global Importer Intel:\n\n${shareableLink}`;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900">
      {/* HEADER */}
      <div className="p-4 sm:p-6 md:p-8 border-b border-slate-700/50 bg-slate-800/20">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 text-transparent bg-clip-text pr-4">
                {importerName}
                </h2>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-slate-400">
                    <div className="flex items-center gap-2">
                        <MapPinIcon className="w-4 h-4 text-slate-500" />
                        <span>{data.location}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 no-print self-end md:self-auto">
                <button
                    onClick={() => onRefresh(importerName)}
                    disabled={isRefreshing}
                    className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-wait"
                    aria-label={`Refresh data for ${importerName}`}
                >
                    <ArrowPathIcon className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                {/* Export Dropdown */}
                <div className="relative">
                    <button
                        ref={exportButtonRef}
                        onClick={() => setIsExportOpen(!isExportOpen)}
                        className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        aria-label="Export options"
                    >
                        <ArrowDownTrayIcon className="w-6 h-6" />
                    </button>
                    {isExportOpen && (
                        <div 
                            ref={exportDropdownRef}
                            className="absolute top-full right-0 mt-2 w-56 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10 origin-top-right animate-fade-in-down-card"
                            role="menu"
                            aria-orientation="vertical"
                        >
                            <div className="py-1" role="none">
                                <button onClick={() => { onExportJSON(); setIsExportOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 w-full text-left transition-colors" role="menuitem">
                                    <CodeBracketIcon className="w-5 h-5 text-orange-400" />
                                    <span>Export as JSON</span>
                                </button>
                                <button onClick={() => { onExport(); setIsExportOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 w-full text-left transition-colors" role="menuitem">
                                    <DocumentTextIcon className="w-5 h-5 text-orange-400" />
                                    <span>Export as CSV</span>
                                </button>
                                <button onClick={() => { onExportPDF(); setIsExportOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-slate-600 w-full text-left transition-colors" role="menuitem">
                                    <PrinterIcon className="w-5 h-5 text-orange-400" />
                                    <span>Print / PDF</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                onClick={() => onSubscribe(importerName)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                aria-label={`Subscribe to alerts for ${importerName}`}
                >
                <BellIcon className="w-6 h-6" />
                </button>
                <div className="relative">
                    <button
                        ref={shareButtonRef}
                        onClick={() => setIsShareOpen(prev => !prev)}
                        className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-orange-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800"
                        aria-label={`Share data for ${importerName}`}
                    >
                        <ArrowUpTrayIcon className="w-6 h-6" />
                    </button>
                    {isShareOpen && (
                        <div 
                            ref={shareDropdownRef}
                            className="absolute top-full right-0 mt-2 w-48 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-10 origin-top-right animate-fade-in-down-card"
                            role="menu"
                            aria-orientation="vertical"
                        >
                            <div className="py-1" role="none">
                                <a href={mailtoLink} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 w-full text-left" role="menuitem">
                                    <EnvelopeIcon className="w-5 h-5" />
                                    <span>Email</span>
                                </a>
                                <button onClick={handleCopyLink} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 w-full text-left" role="menuitem">
                                    <ClipboardIcon className="w-5 h-5" />
                                    <span>{copyStatus}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-4 sm:p-6 md:p-8">
        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 md:gap-y-10">
          <div className="md:col-span-2">
            <Section icon={<InfoIcon className="w-7 h-7 text-orange-400" />} title="Importer Information">
                {isLoading ? (
                    <SkeletonLoader count={3} />
                ) : (
                    <p className="text-slate-400 whitespace-pre-wrap">{data.information}</p>
                )}
            </Section>
          </div>
          <div className="space-y-8">
            <Section icon={<CalendarDaysIcon className="w-7 h-7 text-orange-400" />} title="Last Shipment">
                {isLoading ? (
                    <SkeletonLoader className="h-5 w-1/2" />
                ) : data.lastShipmentDate && data.lastShipmentDate.toLowerCase() !== 'data not available' ? (
                    <p className="text-slate-200 text-lg font-semibold">{data.lastShipmentDate}</p>
                ) : (
                    <p className="text-slate-500 italic">No Information regarding last shipment available</p>
                )}
            </Section>
            <Section icon={<PhoneIcon className="w-7 h-7 text-orange-400" />} title="Contact">
              {isLoading ? (
                  <SkeletonLoader className="h-5 w-2/3" />
              ) : (
                  <div className="text-slate-400">{formatContactNode(data.contact)}</div>
              )}
            </Section>
          </div>
        </div>

        {/* FULL-WIDTH SECTIONS */}
        <div className="mt-10 space-y-10">
          <div className="pt-10 border-t border-slate-700/50 avoid-break">
            <Section icon={<ShipIcon className="w-7 h-7 text-orange-400" />} title="Import History & Shipment Activity">
                {isLoading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <SkeletonLoader className="h-24 w-full" />
                            <SkeletonLoader className="h-24 w-full" />
                            <SkeletonLoader className="h-24 w-full" />
                        </div>
                        <SkeletonLoader className="h-40 w-full" />
                        <SkeletonLoader count={2} />
                        <SkeletonLoader className="h-20 w-full" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {data.shipmentCounts && <ShipmentStats counts={data.shipmentCounts} />}
                        <ShipmentVolumeChart history={data.shipmentVolumeHistory} />
                        <p className="text-slate-400 whitespace-pre-wrap">{data.shipmentActivity}</p>
                        <ImportHistory history={data.shipmentHistory} />
                    </div>
                )}
            </Section>
          </div>
          
          <div className="pt-10 border-t border-slate-700/50 avoid-break">
            <Section icon={<ShieldCheckIcon className="w-7 h-7 text-orange-400" />} title="Risk Assessment">
                {isLoading ? (
                    <div className="space-y-4">
                        <SkeletonLoader className="h-24 w-full" />
                        <SkeletonLoader className="h-24 w-full" />
                        <SkeletonLoader className="h-24 w-full" />
                    </div>
                ) : (
                    <RiskAssessmentSection assessment={data.riskAssessment} />
                )}
            </Section>
          </div>
          
          <div className="pt-10 border-t border-slate-700/50 avoid-break">
            <Section icon={<GlobeIcon className="w-7 h-7 text-orange-400" />} title="Global Trade Footprint">
                {isLoading ? (
                    <SkeletonLoader className="h-64 w-full" />
                ) : (
                    <div>
                        <WorldMap partners={data.topTradePartners} onCountryClick={onSearchSimilar} />
                        {/* Detailed Trade Partner List for complete volume visibility */}
                        {data.topTradePartners && data.topTradePartners.length > 0 && (
                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data.topTradePartners.map((partner, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-slate-900/50 rounded border border-slate-700/50 hover:border-slate-600">
                                        <span className="text-slate-300 font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            {partner.country}
                                        </span>
                                        <span className="text-sm text-slate-400 bg-slate-800 px-2 py-1 rounded">{partner.tradeVolume}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Section>
          </div>

          <div className="pt-10 border-t border-slate-700/50 avoid-break">
            <Section icon={<BoxIcon className="w-7 h-7 text-orange-400" />} title="Top Commodity Analysis">
                {isLoading ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-slate-900/50 p-4 rounded-lg space-y-3">
                                <SkeletonLoader className="h-5 w-3/4 mb-2" />
                                <SkeletonLoader count={2} />
                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                    <SkeletonLoader className="h-6 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <CommodityDetailsList commodities={data.topCommodityFlows} />
                )}
            </Section>
          </div>
          
          <div className="pt-10 border-t border-slate-700/50 avoid-break no-print">
             <div 
                className="flex items-center justify-between cursor-pointer group select-none"
                onClick={() => setIsSimilarVisible(!isSimilarVisible)}
             >
                <div className="flex items-center gap-3">
                    <UsersIcon className="w-7 h-7 text-orange-400" />
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-orange-300 transition-colors">Similar Importers</h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isSimilarVisible ? 'rotate-180' : ''}`} />
             </div>
             {isSimilarVisible && (
                 <div className="mt-6">
                    <SimilarImportersSection importerName={importerName} onSearch={onSearchSimilar} onSubscribe={onSubscribe} />
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* FOOTER - COLLAPSIBLE SECTIONS */}
      <div className="bg-slate-900/50">
        <div className="border-t border-slate-700/50">
             <div
                onClick={() => setIsContactFormVisible(prev => !prev)}
                className="w-full flex justify-between items-center px-4 sm:px-6 md:px-8 py-5 cursor-pointer group no-print"
                aria-expanded={isContactFormVisible}
                role="button"
                tabIndex={0}
            >
                <div className="flex items-center gap-3">
                    <EnvelopeIcon className="w-7 h-7 text-orange-400" />
                    <h3 className="text-xl font-bold text-slate-200 group-hover:text-orange-300 transition-colors">Contact Importer</h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-slate-400 transition-transform duration-300 ${isContactFormVisible ? 'rotate-180' : ''}`} />
            </div>
            {isContactFormVisible && (
                <div className="px-4 sm:px-6 md:px-8 pb-6 no-print">
                    <ContactForm />
                </div>
            )}
        </div>
      </div>
      <style>{`
        @keyframes fadeInDownCard {
            from { opacity: 0; transform: translateY(-10px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-down-card {
            animation: fadeInDownCard 0.15s ease-out forwards;
        }
        @keyframes growBar {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
        }
        .animate-grow-bar {
            transform-origin: bottom;
            animation: growBar 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
