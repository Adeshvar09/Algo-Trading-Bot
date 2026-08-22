import { config } from './env.config';

export const poolConfig = config.databaseUrl
  ? { connectionString: config.databaseUrl }
  : {
      host: config.pgHost,
      port: config.pgPort,
      user: config.pgUser,
      password: config.pgPassword,
      database: config.pgDatabase,
    };
