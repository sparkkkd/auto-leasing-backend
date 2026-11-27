import { InvestorType, PaymentDirection, Prisma } from '@prisma/client';

export interface PaymentsListResponse {
  id: string;
  direction: PaymentDirection;
  amount: Prisma.Decimal;
  paymentDate: Date;
  comments: string | null;

  deal: {
    id: string;
    contractNumber: string;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      middleName: string | null;
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
      color: string | null;
      year: number;
      licensePlate: string | null;
      vin: string | null;
    };
  };

  // TODO Documents

  createdAt: Date;
}

export interface PaymentResponse {
  id: string;
  direction: PaymentDirection;
  amount: Prisma.Decimal;
  paymentDate: Date;
  comments: string | null;
  notes: string[];

  deal: {
    id: string;
    contractNumber: string;
    comments: string | null;

    client: {
      id: string;
      firstName: string;
      lastName: string;
      middleName: string | null;
      phone: string | null;
      email: string | null;
      comments: string | null;
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
      color: string | null;
      year: number;
      licensePlate: string | null;
      vin: string | null;
      equipment: string | null;
      showroom: string | null;
      purchasePrice: Prisma.Decimal;
      sellingPrice: Prisma.Decimal;
    };
  };

  createdAt: Date;
  updatedAt: Date;
}
