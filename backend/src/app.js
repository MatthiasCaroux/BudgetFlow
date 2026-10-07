import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import { taskRouter } from './routes/taskRoute.js';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());


app.get('/', (_request, response) => {
  response.status(200).json({ message: 'Appli de taches !' });
});

app.get('/api/health', (_request, response) => {
  response.status(200).json({ status: 'ok' });
});


app.use('/api/tasks', taskRouter);

export default app;
