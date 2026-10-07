import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
// Sans secret JWT, n'importe qui pourrait forger des tokens : on refuse de démarrer
if (!config.jwtSecret || !config.mongoURI) {
    console.error('JWT_SECRET et MONGO_URI doivent être définis dans backend/.env (voir .env.example)');
    process.exit(1);
}

await connectDB(config.mongoURI);

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`API disponible sur http://localhost:${port}`);
});
