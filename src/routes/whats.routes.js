import {Router} from 'express';
import whatsController from '../controllers/WhatsPixController';

const router = new Router();


router.post('/webhook', whatsController.index);
router.get('/webhook', whatsController.index);


export default router;