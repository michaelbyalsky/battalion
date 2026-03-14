import { db, companies, soldiers, units } from './index'

async function seed() {
  console.log('Seeding database...')

  const [company] = await db
    .insert(companies)
    .values({ name: 'יחידה 8200 - פיתוח' })
    .returning()

  const [unit] = await db
    .insert(units)
    .values({ companyId: company.id, name: 'מחלקה א' })
    .returning()

  await db.insert(soldiers).values([
    {
      companyId: company.id,
      name: 'דוד לוי',
      phone: '+972500000001',
      role: 'commander',
      unitId: unit.id,
      capabilities: [],
    },
    {
      companyId: company.id,
      name: 'יוסי כהן',
      phone: '+972500000002',
      role: 'shift_manager',
      unitId: unit.id,
      capabilities: ['M16', 'חובש'],
    },
    {
      companyId: company.id,
      name: 'רון מזרחי',
      phone: '+972500000003',
      role: 'soldier',
      unitId: unit.id,
      capabilities: ['M16', 'MAG'],
    },
  ])

  console.log(`✓ Seeded company: ${company.name}`)
  console.log('✓ Seed complete')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
