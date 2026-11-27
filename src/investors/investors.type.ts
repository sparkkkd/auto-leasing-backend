import { DealStatus, InvestorType } from '@prisma/client';

export interface InvestorListResponse {
  id: string;
  name: string;
  type: InvestorType;
  contactPerson: string | null;
  phone: string | null;
  bankDetails: string | null;
  comments: string | null;

  _count: {
    deals: number;
  };

  createdAt: Date;
}

export interface InvestorResponse {
  id: string;
  name: string;
  type: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  bankDetails: string | null;
  comments: string | null;
  notes: string[];

  deals: {
    id: string;
    contractNumber;
    status: DealStatus;
  }[];

  _count: {
    deals: number;
  };

  // TODO documents

  createdAt: Date;
  updatedAt: Date;
}
