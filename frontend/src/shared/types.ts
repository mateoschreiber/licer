export interface UserSession {
  id: string;
  email: string;
  name: string;
  supplierId: string | null;
  roles: string[];
  permissions: string[];
}

export interface ApiListParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface TenderSummary {
  id: string;
  code: string;
  title: string;
  status: string;
  bidDeadline: string;
  questionDeadline?: string;
  currency: string;
}

export interface BidSummary {
  id: string;
  tenderId: string;
  supplierId: string;
  version: number;
  status: string;
  submittedAt?: string;
  totalAmount?: string;
  tender?: TenderSummary;
}
