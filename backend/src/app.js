import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { transactionRouter } from './routes/transactionRoute.js';
import { authRouter } from './routes/authRoute.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// Seul le front configuré dans CORS_ORIGIN peut appeler l'API depuis un navigateur
app.use(cors({ origin: config.corsOrigin }));
app.use(helmet());
// Limite la taille des corps JSON : une transaction ou un login pèse quelques centaines d'octets
app.use(express.json({ limit: '10kb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /:
 *   get:
 *     summary: Message d'accueil de l'API
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Message d'accueil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API BudgetFlow
 */
app.get('/', (_request, response) => {
  response.status(200).json({ message: 'API BudgetFlow' });
});

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Vérifie que l'API fonctionne
 *     tags: [General]
 *     responses:
 *       200:
 *         description: L'API est disponible
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});

app.use('/api/transactions', transactionRouter);
app.use('/api/auth', authRouter);

// En dernier : routes inconnues puis erreurs, toujours au format { error: { code, message } }
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
