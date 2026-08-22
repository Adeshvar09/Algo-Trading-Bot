import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  pgHost: process.env.PGHOST || 'localhost',
  pgPort: parseInt(process.env.PGPORT || '5432', 10),
  pgUser: process.env.PGUSER || 'postgres',
  pgPassword: process.env.PGPASSWORD || 'Miru@123',
  pgDatabase: process.env.PGDATABASE || 'algotrading',
  defaultUserId: 1
};
