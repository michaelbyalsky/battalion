import { Injectable } from '@nestjs/common'
import { db, soldiers } from '@company/db'
import { eq } from 'drizzle-orm'

@Injectable()
export class SoldiersService {
  list(companyId: string) {
    return db.select().from(soldiers).where(eq(soldiers.companyId, companyId))
  }
}
