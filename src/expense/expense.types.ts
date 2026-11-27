import { CarStatus, ExpenseType, Prisma, UserRole } from '@prisma/client';

export interface ExpenseResponse {
  id: string;
  type: ExpenseType;
  amount: Prisma.Decimal;
  comments: string | null;
  notes: string[];

  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    vin: string | null;
    licensePlate: string | null;
    color: string | null;
    status: CarStatus;
  } | null;

  author: {
    id: string;
    name: string;
    role: UserRole;
  };

  createdAt: Date;
  updatedAt: Date;
}
