export interface UserSession {
  id: string;
  email: string;
  name: string;
  lastName: string | null;
  mustChangePassword: boolean;
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
  questionDeadline?: string | null;
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
  receiptCode?: string | null;
  currency?: string;
  paymentTerms?: string | null;
  deliveryTerms?: string | null;
  tender?: TenderSummary;
  supplier?: { id: string; ruc: string; legalName: string; tradeName?: string | null };
}
