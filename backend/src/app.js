import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { transactionRouter } from './routes/transactionRoute.js';
import { authRouter } from './routes/authRoute.js';

const app = express();

// Seul le front configuré dans CORS_ORIGIN peut appeler l'API depuis un navigateur
app.use(cors({ origin: config.corsOrigin }));
app.use(helmet());
// Limite la taille des corps JSON : une transaction ou un login pèse quelques centaines d'octets
app.use(express.json({ limit: '10kb' }));


app.get('/', (_request, response) => {
  response.status(200).json({ message: 'API BudgetFlow' });
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});


app.use('/api/transactions', transactionRouter);


app.use('/api/auth', authRouter);


export default app;
