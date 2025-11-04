import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import logger from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app: Express = express();

// Middleware de segurança
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging de requisições
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Rotas
app.use('/api/v1', routes);

// Rota de fallback
app.get('/', (_req, res) => {
  res.json({
    message: 'FisioQ Backend API',
    version: '1.0.0',
    docs: '/api/v1/health',
  });
});

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Iniciar servidor
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📝 Ambiente: ${config.nodeEnv}`);
  logger.info(`🌐 CORS origin: ${config.cors.origin.join(', ')}`);
});

export default app;

