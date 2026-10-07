import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';
import { config } from './config/env.js';
await connectDB(config.mongoURI);

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`API disponible sur http://localhost:${port}`);
});
