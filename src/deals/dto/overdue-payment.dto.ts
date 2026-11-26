export class OverduePaymentDto {
  dealId!: string;
  clientId!: string;
  clientName!: string;
  nextPaymentDate!: Date;
  monthlyPayment!: number;
  status!: 'warning' | 'critical' | 'overdue';
  daysUntilDue!: number;
  currentMonth!: number;
}
