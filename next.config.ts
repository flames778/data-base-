import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Produce a standalone server bundle for containerized (Docker) deployment.
  // Set NEXT_OUTPUT_STANDALONE=1 in the Dockerfile. Unset on Vercel, which
  // builds its own serverless output (standalone is ignored there anyway).
  output: process.env.NEXT_OUTPUT_STANDALONE === "1" ? "standalone" : undefined,

  // Security headers applied to every response. Authorization is always
  // enforced server-side; these headers are defensive hardening.
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          // HSTS only makes sense over HTTPS in production.
          ...(isProd
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry build-time options. All optional — the app runs fine without a
  // Sentry account; error reporting is simply disabled until SENTRY_DSN /
  // NEXT_PUBLIC_SENTRY_DSN and these org/project values are set.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  silent: true,

  // Proxies Sentry's event traffic through this app's own domain
  // (/monitoring) instead of directly to *.sentry.io. Avoids needing to
  // widen the Content-Security-Policy's connect-src, and avoids ad-blockers
  // that block requests to sentry.io.
  tunnelRoute: "/monitoring",

  // Reduce noisy source-map upload logs; only matters when authToken is set.
  disableLogger: true,
});
