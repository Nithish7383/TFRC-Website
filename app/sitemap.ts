import type { MetadataRoute } from 'next'

const SITE_URL = 'https://thefirstruleclub.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/join`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/register`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/gallery`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/status`, changeFrequency: 'monthly', priority: 0.3 },
  ]
}
