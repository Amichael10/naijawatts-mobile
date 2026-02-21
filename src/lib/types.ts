export interface Tenant {
  id: string;
  name: string;
  flatLabel: string;
}

export interface BillCalculation {
  id: string;
  date: string;
  mode: 'smart' | 'equal';
  totalAmount: number;
  totalUnits?: number;
  costPerUnit?: number;
  results: TenantResult[];
}

export interface TenantResult {
  tenantId: string;
  name: string;
  flatLabel: string;
  kwhUsed?: number;
  amountOwed: number;
}

export interface Compound {
  id: string;
  name: string;
  tenants: Tenant[];
  history: BillCalculation[];
  createdAt: string;
}
