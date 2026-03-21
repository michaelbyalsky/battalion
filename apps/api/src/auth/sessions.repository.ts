import { Injectable } from '@nestjs/common'
import { db, sessions, eq, and } from '@battalion/db'

@Injectable()
export class SessionsRepository {
  create(data: { jti: string; soldierId: string; companyId: string; ip?: string; userAgent?: string; deviceName?: string }) {
    return db.insert(sessions).values(data)
  }

  findByJti(jti: string) {
    return db.query.sessions.findFirst({ where: eq(sessions.jti, jti) })
  }

  listBySoldier(soldierId: string) {
    return db.select().from(sessions).where(eq(sessions.soldierId, soldierId))
  }

  deleteByJti(jti: string) {
    return db.delete(sessions).where(eq(sessions.jti, jti))
  }

  deleteAllBySoldier(companyId: string, soldierId: string) {
    return db.delete(sessions).where(and(eq(sessions.companyId, companyId), eq(sessions.soldierId, soldierId)))
  }
}
