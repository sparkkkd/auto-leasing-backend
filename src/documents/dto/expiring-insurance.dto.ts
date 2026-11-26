export class ExpiringInsuranceDto {
  carId!: string;
  carName!: string;
  licensePlate?: string;
  insuranceId!: string;
  expiresAt!: Date;
  daysUntilExpiry!: number;
  status!: 'critical' | 'expiring' | 'expired';
}
