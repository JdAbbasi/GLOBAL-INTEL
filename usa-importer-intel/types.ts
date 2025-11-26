
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
  source?: string;
  raw?: any;
}

export interface ShipmentEvent {
  date: string;
  shipper: string;
  origin: string;
  portOfDischarge: string;
  commodity: string;
  volume: string; // TEUs, Weight, or Quantity
  carrier?: string;
  hsCode?: string;
  bolNumber?: string;
  source?: string;
}

export interface ShipmentVolume {
  year: number;
  volume: number;
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
  sources?: Source[];
}

export interface DetailedImporterResult {
  parsedData: ParsedImporterData;
}

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
