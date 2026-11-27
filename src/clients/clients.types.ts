import { DealStatus } from '@prisma/client';

export interface ClientsListResponse {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string;

  deals: {
    id: string;
    contractNumber: string;
    status: DealStatus;
  }[];

  cars: {
    id: string;
    model: string;
    make: string | null;
    color: string | null;
    licensePlate: string | null;
    vin: string | null;
    equipment: string | null;
  }[];

  _count: {
    deals: number;
    cars: number;
  };
}

export interface ClientResponse {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string;
  email: string | null;
  passportData: string;
  address: string;
  notes: string[];
  comments: string | null;

  deals: {
    id: string;
    contractNumber: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    status: DealStatus;
  }[];

  cars: {
    id: string;
    make: string;
    model: string;
    color: string | null;
    year: number;
    equipment: string | null;
    licensePlate: string | null;
    vin: string | null;
  }[];

  _count: {
    deals: number;
    cars: number;
  };

  createdAt: Date;
  updatedAt: Date;
}
