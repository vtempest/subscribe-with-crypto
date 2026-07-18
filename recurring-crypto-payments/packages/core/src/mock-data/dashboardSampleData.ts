import type { DashboardApiResponse } from '../types/dashboard';
import type { CompletedPayment, ScheduledPayment } from '../types/payments';
import type { VendorClient } from '../types/VendorClient';
import type { GetPayoutsApiResponse } from '../types/payout';
import type { Vendor } from '../types/Vendor';

export const vendorMockData: Vendor = {
  _id: 'demo-vendor-001',
  name: 'Acme Corp',
  email: 'demo@acmecorp.com',
  apiKey: 'demo-api-key-abc123',
  plan: 'Premium Subscription',
  vendorContract: '0x8880DA75707ea777c0bdFBbF679b56cfac41a7d7',
  tokenAddress: '0xC9606fea595Ed3a94B4c8548ca0C2252C7856E89',
  webhookUrl: 'https://acmecorp.com/webhooks/payment',
  returnUrl: 'https://acmecorp.com/thank-you',
  amount: 20,
};

const mockPayments: CompletedPayment[] = [
  {
    _id: 'pay-001',
    vendorContract: vendorMockData.vendorContract as string,
    userAddress: '0xABCDEF1234567890ABCdEf1234567890AbCdEf12',
    amount: 20000000,
    tokenAddress: vendorMockData.tokenAddress as string,
    paymentDate: new Date(2026, 5, 1),
    vendorId: vendorMockData._id,
    vendorClientId: 'client-001',
    status: 'paid',
    hash: '0x9b3e9e7b548f7fd5b5e7bc53a011726aa1d004748de04eaea543e6e7854ffcc8',
    remarks: null,
  },
  {
    _id: 'pay-002',
    vendorContract: vendorMockData.vendorContract as string,
    userAddress: '0x1111222233334444555566667777888899990000',
    amount: 20000000,
    tokenAddress: vendorMockData.tokenAddress as string,
    paymentDate: new Date(2026, 5, 15),
    vendorId: vendorMockData._id,
    vendorClientId: 'client-002',
    status: 'paid',
    hash: '0xabc1abc1abc1abc1abc1abc1abc1abc1abc1abc1abc1abc1abc1abc1abc1abc1',
    remarks: null,
  },
  {
    _id: 'pay-003',
    vendorContract: vendorMockData.vendorContract as string,
    userAddress: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
    amount: 20000000,
    tokenAddress: vendorMockData.tokenAddress as string,
    paymentDate: new Date(2026, 6, 1),
    vendorId: vendorMockData._id,
    vendorClientId: 'client-003',
    status: 'failed',
    hash: null,
    remarks: 'Insufficient allowance',
  },
];

export const dashboardMockData: DashboardApiResponse = {
  chartData: [
    { time: '00:00', amount: 0 },
    { time: '03:00', amount: 0 },
    { time: '06:00', amount: 20 },
    { time: '09:00', amount: 40 },
    { time: '12:00', amount: 60 },
    { time: '15:00', amount: 60 },
    { time: '18:00', amount: undefined },
    { time: '21:00', amount: undefined },
    { time: '24:00', amount: undefined },
  ],
  recentPayments: mockPayments,
  totalDaily: 60,
  pendingBalance: 40000000,
};

export const paymentsMockData: ScheduledPayment[] = [
  ...mockPayments,
  {
    _id: 'sched-001',
    vendorContract: vendorMockData.vendorContract as string,
    userAddress: '0xABCDEF1234567890ABCdEf1234567890AbCdEf12',
    amount: 20000000,
    tokenAddress: vendorMockData.tokenAddress as string,
    paymentDate: new Date(2026, 7, 1),
    vendorId: vendorMockData._id,
    vendorClientId: 'client-001',
  },
];

export const customersMockData: VendorClient[] = [
  {
    _id: 'client-001',
    vendor: vendorMockData._id,
    status: 'active',
    nextDate: new Date(2026, 7, 1),
    billingInfo: {
      name: 'Alice Johnson',
      address: '123 Main St, New York, NY 10001',
      email: 'alice@example.com',
    },
    paymentMethod: {
      token: 'USDT',
      tokenAddress: vendorMockData.tokenAddress as string,
      wallet: '0xABCDEF1234567890ABCdEf1234567890AbCdEf12',
      sufficientAllowance: true,
      sufficientBalance: true,
    },
    invoices: [],
  },
  {
    _id: 'client-002',
    vendor: vendorMockData._id,
    status: 'active',
    nextDate: new Date(2026, 7, 15),
    billingInfo: {
      name: 'Bob Smith',
      address: '456 Oak Ave, San Francisco, CA 94102',
      email: 'bob@example.com',
    },
    paymentMethod: {
      token: 'USDT',
      tokenAddress: vendorMockData.tokenAddress as string,
      wallet: '0x1111222233334444555566667777888899990000',
      sufficientAllowance: true,
      sufficientBalance: false,
    },
    invoices: [],
  },
  {
    _id: 'client-003',
    vendor: vendorMockData._id,
    status: 'cancelled',
    nextDate: null,
    billingInfo: {
      name: 'Carol White',
      address: '789 Pine Rd, Austin, TX 78701',
      email: 'carol@example.com',
    },
    paymentMethod: {
      token: 'USDT',
      tokenAddress: vendorMockData.tokenAddress as string,
      wallet: '0xDEADBEEFDEADBEEFDEADBEEFDEADBEEFDEADBEEF',
      sufficientAllowance: false,
      sufficientBalance: false,
    },
    invoices: [],
  },
];

export const payoutsMockData: GetPayoutsApiResponse = {
  vendor: vendorMockData,
  pendingBalance: '40000000',
  owner: '0xOwnerWalletAddress0000000000000000000000',
  payouts: [
    {
      _id: 'payout-001',
      payoutDate: new Date(2026, 5, 30),
      amount: 100000000,
      tokenAddress: vendorMockData.tokenAddress as string,
      userAddress: '0xOwnerWalletAddress0000000000000000000000',
      token: 'USDT',
      hash: '0xpayout1hash000000000000000000000000000000000000000000000000000000',
      vendorId: vendorMockData._id,
    },
  ],
};
