import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import { taskRouter } from './routes/taskRoute.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

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
 *                   example: Appli de taches !
 */
app.get('/', (_request, response) => {
  response.status(200).json({ message: 'Appli de taches !' });
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


app.use('/api/tasks', taskRouter);

export default app;
