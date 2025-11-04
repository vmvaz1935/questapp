import { Router } from 'express';
import { authRoutes } from '../controllers/auth.controller.js';
import { PatientController } from '../controllers/patient.controller.js';
import { ResultController } from '../controllers/result.controller.js';
import { SyncController } from '../controllers/sync.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimiter, apiRateLimiter, syncRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validator.js';
import {
  createPatientSchema,
  updatePatientSchema,
} from '../validators/patient.validator.js';
import { createResultSchema } from '../validators/result.validator.js';
import { syncSchema } from '../validators/sync.validator.js';

const router = Router();

// Auth Controller (usado via authRoutes)

// Auth routes (sem autenticação)
router.post('/auth/register', authRateLimiter, authRoutes.register);
router.post('/auth/login', authRateLimiter, authRoutes.login);
router.post('/auth/google', authRateLimiter, authRoutes.googleAuth);
router.post('/auth/refresh', authRoutes.refreshToken);

// Auth routes (com autenticação)
router.post('/auth/logout', authenticateToken, authRoutes.logout);

// Patient Controller
const patientController = new PatientController();

router.post(
  '/patients',
  authenticateToken,
  apiRateLimiter,
  validate(createPatientSchema),
  patientController.create.bind(patientController)
);

router.get(
  '/patients',
  authenticateToken,
  apiRateLimiter,
  patientController.findAll.bind(patientController)
);

router.get(
  '/patients/:id',
  authenticateToken,
  apiRateLimiter,
  patientController.findOne.bind(patientController)
);

router.put(
  '/patients/:id',
  authenticateToken,
  apiRateLimiter,
  validate(updatePatientSchema),
  patientController.update.bind(patientController)
);

router.delete(
  '/patients/:id',
  authenticateToken,
  apiRateLimiter,
  patientController.delete.bind(patientController)
);

// Result Controller
const resultController = new ResultController();

router.post(
  '/results',
  authenticateToken,
  apiRateLimiter,
  validate(createResultSchema),
  resultController.create.bind(resultController)
);

router.get(
  '/results',
  authenticateToken,
  apiRateLimiter,
  resultController.findAll.bind(resultController)
);

router.get(
  '/results/:id',
  authenticateToken,
  apiRateLimiter,
  resultController.findOne.bind(resultController)
);

router.delete(
  '/results/:id',
  authenticateToken,
  apiRateLimiter,
  resultController.delete.bind(resultController)
);

// Sync Controller
const syncController = new SyncController();

router.post(
  '/sync',
  authenticateToken,
  syncRateLimiter,
  validate(syncSchema),
  syncController.sync.bind(syncController)
);

router.get(
  '/sync/status',
  authenticateToken,
  apiRateLimiter,
  syncController.getStatus.bind(syncController)
);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;

