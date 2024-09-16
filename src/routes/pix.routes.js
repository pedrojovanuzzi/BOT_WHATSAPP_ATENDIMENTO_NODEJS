import {Router} from 'express';
import pixController from '../controllers/PixController';
import { loginRequired } from '../middlewares/Middlewares';

const router = new Router();


router.post('/gerador', loginRequired, pixController.gerarPix);
router.get('/gerador', loginRequired, pixController.gerarPix);

router.post('/geradorAll', loginRequired, pixController.gerarPixAll);
router.get('/geradorAll', loginRequired, pixController.gerarPixAll);

router.post('/geradorAberto', loginRequired, pixController.gerarPixAberto);
router.get('/geradorAberto', loginRequired, pixController.gerarPixAberto);

// router.post('/PixUnicoVencido/webhook', pixController.StatusUpdatePixUnicoVencido);
router.post('/PixTodosVencidos/webhook', pixController.StatusUpdatePixTodosVencidos);



export default router;