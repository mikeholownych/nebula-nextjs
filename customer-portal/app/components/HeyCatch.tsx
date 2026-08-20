'use client'

import { analytics } from '@heycatch/sdk'

analytics.init({
  projectKey: 'hck_pk_UDEJlnGqF84u4i2q08NwcTvTYGrXLns_',
  install: {
    framework: 'nextjs',
    frameworkVersion: '16',
    agent: 'other',
  },
})

export default function HeyCatch() {
  return null
}
