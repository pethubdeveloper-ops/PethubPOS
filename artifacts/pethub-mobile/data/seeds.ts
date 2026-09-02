export const WAREHOUSE  = 'Central Warehouse';
export const PRESIDENT  = 'President';
export const ACCOUNT_PASSWORD = 'pethub2020';

export type AccountRole = 'branch' | 'warehouse' | 'president';
export interface BranchAccount {
  username: string;
  branch: string;
  role: AccountRole;
  address?: string;
}

/** Offline/bootstrap fallback only; the live directory comes from PostgreSQL. */
export const LEGACY_BRANCH_ACCOUNTS: BranchAccount[] = [
  { username: 'president', branch: PRESIDENT, role: 'president' },
  { username: 'warehouse', branch: WAREHOUSE, role: 'warehouse', address: 'Pet Hub Warehouse, Cavite City, Cavite' },
  { username: 'angeles', branch: 'Angeles Branch', role: 'branch', address: 'MacArthur Hwy, Angeles City, Pampanga' },
  { username: 'bataan', branch: 'Bataan Branch', role: 'branch', address: 'National Road, Balanga City, Bataan' },
  { username: 'laspinas', branch: 'Las Piñas Branch', role: 'branch', address: 'Alabang-Zapote Road, Las Piñas City, Metro Manila' },
  { username: 'baliwag', branch: 'Baliwag Branch', role: 'branch', address: 'D.R. Trinidad Hwy, Baliwag, Bulacan' },
  { username: 'bacoor', branch: 'Bacoor Main Branch', role: 'branch', address: 'Molino Road, Bacoor City, Cavite' },
  { username: 'generaltrias', branch: 'General Trias Branch', role: 'branch', address: "Governor's Drive, General Trias, Cavite" },
  { username: 'mambog', branch: 'Mambog, Bacoor Branch', role: 'branch', address: 'Mambog Road, Bacoor City, Cavite' },
  { username: 'paco', branch: 'Paco, Manila Branch', role: 'branch', address: 'Pedro Gil Street, Paco, Manila' },
  { username: 'paranaque', branch: 'Parañaque Branch', role: 'branch', address: 'Dr. A. Santos Avenue, Parañaque City, Metro Manila' },
];

export const BRANCH_TO_USERNAME: Record<string, string> = Object.fromEntries(
  LEGACY_BRANCH_ACCOUNTS.map(account => [account.branch, account.username]),
);
export const USERNAME_TO_BRANCH: Record<string, string> = Object.fromEntries(
  LEGACY_BRANCH_ACCOUNTS.map(account => [account.username, account.branch]),
);
export const BRANCHES = LEGACY_BRANCH_ACCOUNTS.filter(account => account.role === 'branch').map(account => account.branch);

export const ACCOUNTS = [PRESIDENT, WAREHOUSE, ...BRANCHES];

export interface OrderItem {
  productId: number;
  qty: number;
  dispatchBatchId?: string;
}

export interface Order {
  number: string;
  branch: string;
  date: string;
  priority: 'Standard' | 'Urgent';
  status: 'Order Request' | 'On-going' | 'Pending Payment' | 'Completed' | 'Declined' | 'Not Received';
  items: OrderItem[];
  notes?: string;
  proofPhoto?: string;
  dispatchPhoto?: string;
  paymentMethod?: 'Cash' | 'Bank/Cheque' | 'Loan';
  terms?: '30 Days' | 'No Due';
}

const si = (arr: [number, number][]): OrderItem[] =>
  arr.map(([productId, qty]) => ({ productId, qty }));

export const SEED_ORDERS: Order[] = [
  { number: 'WH-001', branch: 'Angeles Branch', date: '20 Jul 2026', priority: 'Standard', status: 'Order Request', items: si([[10,3],[11,5]]) },
  { number: 'WH-002', branch: 'Angeles Branch', date: '15 Jul 2026', priority: 'Standard', status: 'Pending Payment', paymentMethod: 'Loan', items: si([[1,10],[5,6]]) },
  { number: 'WH-003', branch: 'Angeles Branch', date: '10 Jul 2026', priority: 'Urgent', status: 'Completed', items: si([[7,4],[9,2]]), proofPhoto: undefined },
  { number: 'WH-004', branch: 'Las Piñas Branch', date: '21 Jul 2026', priority: 'Standard', status: 'Order Request', items: si([[8,6]]) },
  { number: 'WH-005', branch: 'Bacoor Main Branch', date: '18 Jul 2026', priority: 'Urgent', status: 'On-going', items: si([[2,8],[6,4]]) },
  { number: 'WH-006', branch: 'Bataan Branch', date: '08 Jul 2026', priority: 'Standard', status: 'Completed', items: si([[3,5]]) },
];

export interface BranchRequestItem {
  productId: number;
  qty: number;
  batchId?: string;
  priceKey?: 'cost' | 'srp' | 'wholesale';
}

export interface BranchRequest {
  id: string;
  fromBranch: string;
  toBranch: string;
  items: BranchRequestItem[];
  date: string;
  status: 'Pending' | 'Approved' | 'Declined' | 'Settled';
}

export const SEED_REQUESTS: BranchRequest[] = [
  { id: 'BR-001', fromBranch: 'Bataan Branch',        toBranch: 'Angeles Branch',     items: [{productId:7,qty:5},{productId:1,qty:3}], date: '19 Jul 2026', status: 'Pending' },
  { id: 'BR-002', fromBranch: 'Angeles Branch',       toBranch: 'Las Piñas Branch',   items: [{productId:1,qty:12}],                    date: '18 Jul 2026', status: 'Approved' },
  { id: 'BR-003', fromBranch: 'Angeles Branch',       toBranch: 'Bacoor Main Branch', items: [{productId:10,qty:3},{productId:5,qty:6}], date: '21 Jul 2026', status: 'Pending' },
  { id: 'BR-004', fromBranch: 'General Trias Branch', toBranch: 'Angeles Branch',     items: [{productId:9,qty:8}],                     date: '16 Jul 2026', status: 'Declined' },
];

export function getBranchStock(_branchIndex: number, _productId: number, _baseStock: number): number {
  return 0;
}
