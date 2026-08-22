import { Router } from 'express';
import { WatchlistController } from '../controllers/watchlistController';

const router = Router();

router.get('/', WatchlistController.getWatchlist);
router.post('/', WatchlistController.addToWatchlist);
router.delete('/:symbol', WatchlistController.removeFromWatchlist);

export default router;
