import { CarStatus, DealStatus, Prisma } from '@prisma/client';

export interface CarsListResponse {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  equipment: string | null;
  licensePlate: string | null;
  vin: string | null;
  purchasePrice: Prisma.Decimal;
  sellingPrice: Prisma.Decimal;
  status: CarStatus;

  client: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
  } | null;

  deals: {
    id: string;
    contractNumber: string;
  }[];

  createdAt: Date;
}

export interface CarResponse {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string | null;
  equipment: string | null;
  licensePlate: string | null;
  vin: string | null;
  showroom: string | null;
  purchasePrice: Prisma.Decimal;
  sellingPrice: Prisma.Decimal;
  status: CarStatus;
  comments: string | null;
  notes: string[];

  deals: {
    id: string;
    contractNumber: string;
    startDate: Date;
    endDate: Date;
    term: number;
    firstPayment: Prisma.Decimal;
    monthlyPayment: Prisma.Decimal;
    finalCarPrice: Prisma.Decimal;
    clientTotalAmount: Prisma.Decimal;
    investorTotalAmount: Prisma.Decimal;
    status: DealStatus;

    createdAt: Date;
  }[];

  clientId: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
  } | null;

  createdAt: Date;
  updatedAt: Date;
}
