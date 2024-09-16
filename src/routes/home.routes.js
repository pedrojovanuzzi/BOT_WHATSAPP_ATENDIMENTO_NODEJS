import {Router} from 'express';
import homeController from '../controllers/HomeController';

const router = new Router();


router.get('/', homeController.index);
router.post('/login', homeController.login);


export default router;