import { Module } from '@nestjs/common'
import { SoldiersController } from './soldiers.controller'
import { SoldiersService } from './soldiers.service'

@Module({
  controllers: [SoldiersController],
  providers: [SoldiersService],
})
export class SoldiersModule {}
