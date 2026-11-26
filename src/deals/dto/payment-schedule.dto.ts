export interface PaymentScheduleItem {
  month: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  paymentId?: string;
  paidAt?: Date;
  amount?: number;
}

export class PaymentScheduleDto {
  dealId!: string;
  dealStatus!: string;
  clientName!: string;
  monthlyPayment!: number;
  term!: number;
  startDate!: Date;
  payments!: PaymentScheduleItem[];
}

export class ClientPaymentSchedulesDto {
  clientId!: string;
  clientName!: string;
  schedules!: PaymentScheduleDto[];
}
