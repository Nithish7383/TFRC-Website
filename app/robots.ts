import type { MetadataRoute } from 'next'

const SITE_URL = 'https://thefirstruleclub.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/confirmation', '/join/welcome'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
