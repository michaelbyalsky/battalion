import { Injectable } from '@nestjs/common'
import { db, soldiers, companies, eq } from '@battalion/db'

@Injectable()
export class AuthRepository {
  findSoldierByPhone(phone: string) {
    return db.query.soldiers.findFirst({ where: eq(soldiers.phone, phone) })
  }

  findCompanyById(id: string) {
    return db.query.companies.findFirst({ where: eq(companies.id, id) })
  }
}
