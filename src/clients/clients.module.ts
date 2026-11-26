import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { DealsService } from 'src/deals/deals.service';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, DealsService],
  exports: [ClientsService],
})
export class ClientsModule {}
