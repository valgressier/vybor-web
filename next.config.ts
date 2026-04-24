import type { NextConfig } from "next";

const SUPABASE_HOST = "pdyaujycxybddnahsopa.supabase.co";

const securityHeaders = [
  // Prevent rendering in iframes (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Control referrer information
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed by the app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline and unsafe-eval for its runtime chunks
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      // Supabase storage + Google avatars
      `img-src 'self' data: blob: https://${SUPABASE_HOST} https://lh3.googleusercontent.com`,
      // Supabase API + Supabase Realtime (wss) + Google OAuth
      `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST} https://accounts.google.com`,
      "font-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
