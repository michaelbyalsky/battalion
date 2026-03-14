import { db, battalions, companies, platoons, soldiers } from './index'

async function seed() {
  console.log('Seeding database...')

  const [battalion] = await db
    .insert(battalions)
    .values({ name: 'גדוד 8200' })
    .returning()

  // 3 combat companies (פלוגות קו) + 1 support company (פלסם)
  const [companyA, companyB, companyC, supportCompany] = await db
    .insert(companies)
    .values([
      { battalionId: battalion.id, name: 'פלוגה א', type: 'combat' },
      { battalionId: battalion.id, name: 'פלוגה ב', type: 'combat' },
      { battalionId: battalion.id, name: 'פלוגה ג', type: 'combat' },
      { battalionId: battalion.id, name: 'פלסם', type: 'support' },
    ])
    .returning()

  const [platoonA] = await db
    .insert(platoons)
    .values({ companyId: companyA.id, name: 'מחלקה א' })
    .returning()

  await db.insert(soldiers).values([
    // Combat soldiers — company A
    {
      companyId: companyA.id,
      name: 'דוד לוי',
      phone: '+972500000001',
      role: 'commander',
      platoonId: platoonA.id,
      capabilities: [],
    },
    {
      companyId: companyA.id,
      name: 'יוסי כהן',
      phone: '+972500000002',
      role: 'shift_manager',
      platoonId: platoonA.id,
      capabilities: ['M16', 'חובש'],
    },
    {
      companyId: companyA.id,
      name: 'רון מזרחי',
      phone: '+972500000003',
      role: 'soldier',
      platoonId: platoonA.id,
      capabilities: ['M16', 'MAG'],
    },
    // Support company soldier — battalion-wide access
    {
      companyId: supportCompany.id,
      name: 'מיכל גולן',
      phone: '+972500000004',
      role: 'battalion_logistics',
      platoonId: null,
      capabilities: ['לוגיסטיקה'],
    },
  ])

  console.log(`✓ Battalion: ${battalion.name}`)
  console.log(`✓ Companies: ${[companyA, companyB, companyC].map((c) => c.name).join(', ')} (combat)`)
  console.log(`✓ Support Company: ${supportCompany.name}`)
  console.log(`✓ Platoon: ${platoonA.name}`)
  console.log('✓ Seed complete')
  process.exit(0)
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
