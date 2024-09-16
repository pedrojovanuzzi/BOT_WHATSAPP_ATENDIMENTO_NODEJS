"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express');
var _PixController = require('../controllers/PixController'); var _PixController2 = _interopRequireDefault(_PixController);
var _Middlewares = require('../middlewares/Middlewares');

const router = new (0, _express.Router)();


router.post('/gerador', _Middlewares.loginRequired, _PixController2.default.gerarPix);
router.get('/gerador', _Middlewares.loginRequired, _PixController2.default.gerarPix);

router.post('/geradorAll', _Middlewares.loginRequired, _PixController2.default.gerarPixAll);
router.get('/geradorAll', _Middlewares.loginRequired, _PixController2.default.gerarPixAll);

router.post('/geradorAberto', _Middlewares.loginRequired, _PixController2.default.gerarPixAberto);
router.get('/geradorAberto', _Middlewares.loginRequired, _PixController2.default.gerarPixAberto);

// router.post('/PixUnicoVencido/webhook', pixController.StatusUpdatePixUnicoVencido);
router.post('/PixTodosVencidos/webhook', _PixController2.default.StatusUpdatePixTodosVencidos);



exports. default = router;