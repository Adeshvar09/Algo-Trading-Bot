import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolioController';

const router = Router();

router.get('/', PortfolioController.getPortfolio);
router.get('/transactions', PortfolioController.getTransactions);

export default router;
