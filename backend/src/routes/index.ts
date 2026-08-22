import { Router } from 'express';
import stockRoutes from './stockRoutes';
import watchlistRoutes from './watchlistRoutes';
import portfolioRoutes from './portfolioRoutes';
import orderRoutes from './orderRoutes';
import chatRoutes from './chatRoutes';
import { PortfolioController } from '../controllers/portfolioController';
import { sendResponse } from '../utils/responseHandler';

const router = Router();

router.use('/stocks', stockRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/portfolio', portfolioRoutes);
router.get('/transactions', PortfolioController.getTransactions);
router.use('/orders', orderRoutes);
router.use('/chat', chatRoutes);

router.get('/health', (_req, res) => {
  return sendResponse(res, { status: 'healthy', timestamp: new Date().toISOString() });
});

export default router;
