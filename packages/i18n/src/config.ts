export const defaultLocale = 'he' as const
export const locales = ['he', 'en'] as const
export type Locale = (typeof locales)[number]
