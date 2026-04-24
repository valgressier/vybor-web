import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://vybor.app';

  return [
    { url: `${base}/`,         lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${base}/login`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
    { url: `${base}/cgu`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${base}/privacy`,  lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ];
}
