import { Module } from '@nestjs/common'
import { SoldiersController } from './soldiers.controller'
import { SoldiersRepository } from './soldiers.repository'
import { SoldiersService } from './soldiers.service'

@Module({
  controllers: [SoldiersController],
  providers: [SoldiersRepository, SoldiersService],
})
export class SoldiersModule {}
