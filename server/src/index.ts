import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './routes/auth';

const app = express();

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust proxy para obter IP real
app.set('trust proxy', true);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${env.FRONTEND_URL}`);
});

