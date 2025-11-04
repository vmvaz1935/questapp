import rateLimit from 'express-rate-limit';

// Rate limits diferentes por endpoint
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por minuto
  message: 'Muitas requisições. Tente novamente em alguns instantes.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const syncRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 sincronizações por minuto
  message: 'Muitas sincronizações. Tente novamente em alguns instantes.',
  standardHeaders: true,
  legacyHeaders: false,
});

