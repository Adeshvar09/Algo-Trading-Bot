import express from 'express';
import cors from 'cors';
import routes from './routes';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.use('/api', routes);

app.use(errorHandler);

export default app;
