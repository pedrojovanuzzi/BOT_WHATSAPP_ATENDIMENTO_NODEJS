"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express');
var _MenuController = require('../controllers/MenuController'); var _MenuController2 = _interopRequireDefault(_MenuController);
var _Middlewares = require('../middlewares/Middlewares');
var _path = require('path'); var _path2 = _interopRequireDefault(_path);

const router = new (0, _express.Router)();


router.get('/', _Middlewares.loginRequired, _MenuController2.default.index);
router.get('/LastPix', _Middlewares.loginRequired, _MenuController2.default.lastPix);
router.get('/AllPix', _Middlewares.loginRequired, _MenuController2.default.allPix);
router.get('/LastPixOpen', _Middlewares.loginRequired, _MenuController2.default.LastPixOpen);

router.get('/PoliticaPrivacidade', (req, res) => {
    const pdfPath = _path2.default.join(__dirname, '..', 'public', 'pdfs', 'privacidade.pdf'); // Substitua pelo caminho correto do seu PDF
    res.sendFile(pdfPath);
  });

router.get('/TermosContratacao', (req, res) => {
    const pdfPath = _path2.default.join(__dirname, '..', 'public', 'pdfs', 'contratação.pdf'); // Substitua pelo caminho correto do seu PDF
    res.sendFile(pdfPath);
  });
  
router.get('/MudancaEndereco', (req, res) => {
  const pdfPath = _path2.default.join(__dirname, '..', 'public', 'pdfs', 'mudanca_endereco.pdf'); // Substitua pelo caminho correto do seu PDF
  res.sendFile(pdfPath);
});

router.get('/MudancaComodo', (req, res) => {
  const pdfPath = _path2.default.join(__dirname, '..', 'public', 'pdfs', 'mudanca_comodo.pdf'); // Substitua pelo caminho correto do seu PDF
  res.sendFile(pdfPath);
});

router.get('/TrocaTitularidade', (req, res) => {
  const pdfPath = _path2.default.join(__dirname, '..', 'public', 'pdfs', 'troca_de_titularidade.pdf'); // Substitua pelo caminho correto do seu PDF
  res.sendFile(pdfPath);
});

router.get('/AlteracaoPlano', (req, res) => {
  const pdfPath = _path2.default.join(__dirname, '..', 'public', 'pdfs', 'altera_plano.pdf'); // Substitua pelo caminho correto do seu PDF
  res.sendFile(pdfPath);
});

exports. default = router;