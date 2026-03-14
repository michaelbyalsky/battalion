import { Controller, Get, UseGuards, Req } from '@nestjs/common'
import { JwtGuard } from '../common/guards/jwt.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { SoldiersService } from './soldiers.service'
import type { Request } from 'express'

@Controller('soldiers')
@UseGuards(JwtGuard, RolesGuard)
@Roles('commander', 'shift_manager')
export class SoldiersController {
  constructor(private soldiers: SoldiersService) {}

  @Get()
  list(@Req() req: Request & { companyId: string }) {
    return this.soldiers.list(req.companyId)
  }
}
