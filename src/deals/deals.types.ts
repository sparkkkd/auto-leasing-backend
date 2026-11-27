import {
  DealStatus,
  InvestorType,
  PaymentDirection,
  Prisma,
} from '@prisma/client';

export interface DealsListResponse {
  id: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  term: number;
  monthlyPayment: Prisma.Decimal;
  finalCarPrice: Prisma.Decimal;
  clientTotalAmount: Prisma.Decimal;
  investorTotalAmount: Prisma.Decimal;
  status: DealStatus;
  createdAt: Date;

  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };

  investor: {
    id: string;
    name: string;
    type: InvestorType;
  };

  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string | null;
    licensePlate: string | null;
  };

  _count: {
    payments: number;
  };
}

export interface DealResponse {
  id: string;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  term: number;

  firstPayment: Prisma.Decimal;
  monthlyPayment: Prisma.Decimal;
  finalCarPrice: Prisma.Decimal;
  clientTotalAmount: number;
  investorTotalAmount: number;

  status: DealStatus;
  comments: string | null;
  notes: string[];

  contractScanId: string | null;
  investorContractScanId: string | null;

  client: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    phone: string;
    passportData: string;
    address: string;
    comments: string | null;
  };

  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string | null;
    licensePlate: string | null;
    color: string | null;
    equipment: string | null;
    showroom: string | null;
    purchasePrice: Prisma.Decimal;
    sellingPrice: Prisma.Decimal;
  };

  investor: {
    id: string;
    name: string;
    type: InvestorType;
    contactPerson: string | null;
    phone: string | null;
    bankDetails: string | null;
    comments: string | null;
  };

  payments: {
    id: string;
    direction: PaymentDirection;
    amount: Prisma.Decimal;
    paymentDate: Date;
    comments: string | null;
    // TODO documents;
  }[];

  clientRemaining: number;
  investorRemaining: number;
  clientPaid: number;
  investorPaid: number;

  createdAt: Date;
  updatedAt: Date;
}
