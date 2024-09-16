import {Router} from 'express';
import menuController from '../controllers/MenuController';
import { loginRequired } from '../middlewares/Middlewares';
import path from "path";

const router = new Router();


router.get('/', loginRequired, menuController.index);
router.get('/LastPix', loginRequired, menuController.lastPix);
router.get('/AllPix', loginRequired, menuController.allPix);
router.get('/LastPixOpen', loginRequired, menuController.LastPixOpen);

router.get('/PoliticaPrivacidade', (req, res) => {
    const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'privacidade.pdf'); // Substitua pelo caminho correto do seu PDF
    res.sendFile(pdfPath);
  });

router.get('/TermosContratacao', (req, res) => {
    const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'contratação.pdf'); // Substitua pelo caminho correto do seu PDF
    res.sendFile(pdfPath);
  });
  
router.get('/MudancaEndereco', (req, res) => {
  const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'mudanca_endereco.pdf'); // Substitua pelo caminho correto do seu PDF
  res.sendFile(pdfPath);
});

router.get('/MudancaComodo', (req, res) => {
  const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'mudanca_comodo.pdf'); // Substitua pelo caminho correto do seu PDF
  res.sendFile(pdfPath);
});

router.get('/TrocaTitularidade', (req, res) => {
  const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'troca_de_titularidade.pdf'); // Substitua pelo caminho correto do seu PDF
  res.sendFile(pdfPath);
});

router.get('/AlteracaoPlano', (req, res) => {
  const pdfPath = path.join(__dirname, '..', 'public', 'pdfs', 'altera_plano.pdf'); // Substitua pelo caminho correto do seu PDF
  res.sendFile(pdfPath);
});

export default router;