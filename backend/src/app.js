import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { transactionRouter } from './routes/transactionRoute.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());


app.get('/', (_request, response) => {
  response.status(200).json({ message: 'API BudgetFlow' });
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});


app.use('/api/transactions', transactionRouter);

export default app;
