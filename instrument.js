// Sentry error monitoring (backend). Imported BEFORE express in server.js so
// Sentry can instrument the framework. Completely inert unless SENTRY_DSN is set,
// so the app runs identically with or without monitoring configured.
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Error monitoring only for now — no performance tracing (keeps it light + free-tier friendly).
    tracesSampleRate: 0,
  });
  console.log('sentry: backend error monitoring enabled');
}
