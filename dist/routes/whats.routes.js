"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _express = require('express');
var _WhatsPixController = require('../controllers/WhatsPixController'); var _WhatsPixController2 = _interopRequireDefault(_WhatsPixController);

const router = new (0, _express.Router)();


router.post('/webhook', _WhatsPixController2.default.index);
router.get('/webhook', _WhatsPixController2.default.index);


exports. default = router;