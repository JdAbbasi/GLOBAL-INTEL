

export interface RiskAssessment {
  financialStability: string;
  regulatoryCompliance: string;
  geopoliticalRisk: string;
}

export interface TradePartner {
  country: string;
  tradeVolume: string;
}

export interface CommodityFlow {
  name: string;
  percentage: string;
  averagePrice?: string;
  marketTrend?: string;
  topSupplier?: string;
  priceTrendData?: number[];
  importVolumeTrendData?: number[];
}

export interface ContactInfo {
  phone: string;
  website: string;
  email: string;
  address?: string;
}

export interface ImporterSummary {
    importerName: string;
    location: string;
    primaryCommodities: string;
    lastShipmentDate: string;
    contactInformation?: string;
}

export interface ShipmentEvent {
  date: string;
  event: string;
}

export interface ShipmentVolume {
  year: number;
  volume: number; // in TEUs or other unit
}

export interface ShipmentCounts {
  lastMonth: number | string;
  lastQuarter: number | string;
  lastYear: number | string;
}

export interface ParsedImporterData {
  importerName: string;
  location: string;
  lastShipmentDate: string;
  information: string;
  shipmentActivity: string;
  shipmentCounts: ShipmentCounts;
  shipmentHistory: ShipmentEvent[];
  shipmentVolumeHistory: ShipmentVolume[];
  commodities: string;
  contact: ContactInfo | string;
  riskAssessment: RiskAssessment;
  topTradePartners: TradePartner[];
  topCommodityFlows: CommodityFlow[];
}

export interface DetailedImporterResult {
  parsedData: ParsedImporterData;
}


// FIX: Added the missing 'Source' type definition to resolve compilation errors.
export interface Source {
  uri: string;
  title: string;
}

export interface Subscription {
  companyName: string;
  email: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number;
}