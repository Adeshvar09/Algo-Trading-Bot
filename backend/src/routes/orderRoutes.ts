import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { validateOrderInput } from '../validators/orderValidator';

const router = Router();

router.post('/', validateOrderInput, OrderController.executeOrder);

export default router;
