import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  variable: '--font-heebo',
})

export const metadata: Metadata = {
  title: 'מערכת ניהול יחידה',
  description: 'Military unit management system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="bg-bg-base text-text-primary antialiased">{children}</body>
    </html>
  )
}
