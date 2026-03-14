import type { NextConfig } from 'next'

const config: NextConfig = {
  transpilePackages: ['@company/types', '@company/i18n'],
}

export default config
