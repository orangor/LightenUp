import { isDevelopment } from './env.config'

export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
    },
  },
  xssFilter: true,
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  ...(isDevelopment
    ? { hsts: false }
    : {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      }),
} as const
