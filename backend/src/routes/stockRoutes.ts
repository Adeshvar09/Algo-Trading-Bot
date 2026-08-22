import { Router } from 'express';
import { StockController } from '../controllers/stockController';

const router = Router();

router.get('/', StockController.getStocks);
router.get('/:symbol', StockController.getStockBySymbol);
router.get('/:symbol/history', StockController.getStockHistory);
router.get('/:symbol/signal', StockController.getStockSignal);

export default router;
