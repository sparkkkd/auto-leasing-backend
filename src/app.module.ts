import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards';
import { UserModule } from './user/user.module';
import { ClientsModule } from './clients/clients.module';
import { InvestorsModule } from './investors/investors.module';
import { CarsModule } from './cars/cars.module';
import { DealsModule } from './deals/deals.module';
import { PaymentsModule } from './payments/payments.module';
import { DocumentsModule } from './documents/documents.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AuditLogService } from './audit-log/audit-log.service';
import { AuditLogInterceptor } from './audit-log/interceptors';
import { ExpenseModule } from './expense/expense.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ClientsModule,
    InvestorsModule,
    CarsModule,
    DealsModule,
    PaymentsModule,
    DocumentsModule,
    AuditLogModule,
    ExpenseModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (auditLogService: AuditLogService) =>
        new AuditLogInterceptor(auditLogService),
      inject: [AuditLogService],
    },
  ],
})
export class AppModule {}
