import app from './app';
import { config } from './config/env.config';
import { initDatabase } from './db';

initDatabase();

app.listen(config.port, () => {
  console.log(`Algo Trading Bot Server running on http://localhost:${config.port}`);
});
