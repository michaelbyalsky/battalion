import { Injectable } from '@nestjs/common'
import { SoldiersRepository } from './soldiers.repository'

@Injectable()
export class SoldiersService {
  constructor(private readonly repo: SoldiersRepository) {}

  list(companyId: string) {
    return this.repo.list(companyId)
  }
}
