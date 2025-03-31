export interface Property {
  saleDate: string;
  saleTime: string;
  saleLocation: string;
  causeNumber: string | null;
  saleID: string;
  defendantName: string;
  ownerName: string;
  propertyStreet: string;
  propertyCity: string;
  propertyZip: string;
  propertyID: string;
  plaintiffName: string;
  attorneyName: string;
  judgmentAmount: string | null;
  minimumBid: string;
  saleResult: string;
  legal: string;
  sellRedeemTogether: string;
  displaySaleId: string;
  county: string;
  latitude?: number;
  longitude?: number;
}

export type Priority = 'high' | 'medium' | 'low' | null;

export interface PropertyNote {
  priority: Priority;
  comment: string;
  visited: boolean;
  userId: string;
  propertyId: string;
  lastUpdated: string;
}

export interface UserPropertyNote {
  [key: string]: { // propertyId
    [key: string]: PropertyNote; // userId
  };
}