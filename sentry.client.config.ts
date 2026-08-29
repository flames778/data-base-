// This file configures the initialization of Sentry on the client (browser).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),

  // Lower this in production if event volume/cost becomes a concern.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Session replay is off by default — it can capture user-visible content.
  // Turn on deliberately and configure masking if you want it:
  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1.0,

  debug: false,
});
