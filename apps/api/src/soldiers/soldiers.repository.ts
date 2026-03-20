import { Injectable } from '@nestjs/common'
import { db, soldiers, eq } from '@battalion/db'

@Injectable()
export class SoldiersRepository {
  list(companyId: string) {
    return db.select().from(soldiers).where(eq(soldiers.companyId, companyId))
  }
}
