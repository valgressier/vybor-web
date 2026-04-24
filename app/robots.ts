import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register', '/cgu', '/privacy'],
      disallow: ['/feed', '/create', '/messages', '/notifications', '/settings', '/profile', '/question'],
    },
    sitemap: 'https://vybor.app/sitemap.xml',
  };
}
