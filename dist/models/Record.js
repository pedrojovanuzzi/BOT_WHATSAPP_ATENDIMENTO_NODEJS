"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _sequelize = require('sequelize');
var _database2js = require('../config/database2.js'); var _database2js2 = _interopRequireDefault(_database2js);

class Record extends _sequelize.Model {
  static init(sequelize) {
    super.init({
      id: {
        type: _sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      datavenc: {
        type: _sequelize.DataTypes.DATE,
        allowNull: true,
      },
      nossonum: {
        type: _sequelize.DataTypes.STRING(64),
        allowNull: true,
      },
      datapag: {
        type: _sequelize.DataTypes.DATE,
        allowNull: true,
      },
      nome: {
        type: _sequelize.DataTypes.STRING(16),
        allowNull: true,
      },
      recibo: {
        type: _sequelize.DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      status: {
        type: _sequelize.DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'aberto',
      },
      login: {
        type: _sequelize.DataTypes.STRING(255),
        allowNull: true,
      },
      tipo: {
        type: _sequelize.DataTypes.STRING(255),
        allowNull: true,
      },
      cfop_lanc: {
        type: _sequelize.DataTypes.STRING(8),
        allowNull: true,
        defaultValue: '5307',
      },
      obs: {
        type: _sequelize.DataTypes.STRING(255),
        allowNull: true,
      },
      processamento: {
        type: _sequelize.DataTypes.DATE,
        allowNull: true,
      },
      aviso: {
        type: _sequelize.DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'nao',
      },
      url: {
        type: _sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      usergerou: {
        type: _sequelize.DataTypes.STRING(20),
        allowNull: true,
      },
      valorger: {
        type: _sequelize.DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'completo',
      },
      coletor: {
        type: _sequelize.DataTypes.STRING(20),
        allowNull: true,
      },
      linhadig: {
        type: _sequelize.DataTypes.STRING(255),
        allowNull: true,
      },
      valor: {
        type: _sequelize.DataTypes.STRING(50),
        allowNull: true,
      },
      valorpag: {
        type: _sequelize.DataTypes.STRING(50),
        allowNull: true,
      },
      gwt_numero: {
        type: _sequelize.DataTypes.STRING(32),
        allowNull: true,
      },
      imp: {
        type: _sequelize.DataTypes.ENUM('sim', 'nao'),
        allowNull: false,
        defaultValue: 'nao',
      },
      referencia: {
        type: _sequelize.DataTypes.STRING(8),
        allowNull: true,
      },
      tipocob: {
        type: _sequelize.DataTypes.ENUM('fat', 'car'),
        allowNull: false,
        defaultValue: 'fat',
      },
      codigo_carne: {
        type: _sequelize.DataTypes.STRING(32),
        allowNull: true,
      },
      chave_gnet: {
        type: _sequelize.DataTypes.STRING(32),
        allowNull: true,
      },
      chave_gnet2: {
        type: _sequelize.DataTypes.STRING(32),
        allowNull: true,
      },
      chave_bfacil: {
        type: _sequelize.DataTypes.STRING(32),
        allowNull: true,
      },
      chave_juno: {
        type: _sequelize.DataTypes.STRING(32),
        allowNull: true,
      },
      chave_galaxpay: {
        type: _sequelize.DataTypes.STRING(32),
        allowNull: true,
      },
      chave_iugu: {
        type: _sequelize.DataTypes.STRING(96),
        allowNull: true,
      },
      numconta: {
        type: _sequelize.DataTypes.INTEGER,
        allowNull: true,
      },
      gerourem: {
        type: _sequelize.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      remvalor: {
        type: _sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      remdata: {
        type: _sequelize.DataTypes.DATE,
        allowNull: true,
      },
      formapag: {
        type: _sequelize.DataTypes.STRING(100),
        allowNull: true,
      },
      fcartaobandeira: {
        type: _sequelize.DataTypes.STRING(100),
        allowNull: true,
      },
      fcartaonumero: {
        type: _sequelize.DataTypes.STRING(32),
        allowNull: true,
      },
      fchequenumero: {
        type: _sequelize.DataTypes.STRING(100),
        allowNull: true,
      },
      fchequebanco: {
        type: _sequelize.DataTypes.STRING(100),
        allowNull: true,
      },
      fchequeagcc: {
        type: _sequelize.DataTypes.STRING(100),
        allowNull: true,
      },
      percmulta: {
        type: _sequelize.DataTypes.DECIMAL(4, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      valormulta: {
        type: _sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      percmora: {
        type: _sequelize.DataTypes.DECIMAL(4, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      valormora: {
        type: _sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      percdesc: {
        type: _sequelize.DataTypes.DECIMAL(4, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      valordesc: {
        type: _sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      deltitulo: {
        type: _sequelize.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      datadel: {
        type: _sequelize.DataTypes.DATE,
        allowNull: true,
      },
      num_recibos: {
        type: _sequelize.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      num_retornos: {
        type: _sequelize.DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      alt_venc: {
        type: _sequelize.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      uuid_lanc: {
        type: _sequelize.DataTypes.STRING(48),
        allowNull: true,
      },
      tarifa_paga: {
        type: _sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      id_empresa: {
        type: _sequelize.DataTypes.STRING(16),
        allowNull: true,
        unique: true,
      },
      oco01: {
        type: _sequelize.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      oco02: {
        type: _sequelize.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      oco06: {
        type: _sequelize.DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      codigo_barras: {
        type: _sequelize.DataTypes.STRING(64),
        allowNull: true,
      },
    }, {
      sequelize,
      modelName: 'Record',
      tableName: 'sis_lanc', // Substitua pelo nome da sua tabela
      timestamps: false,
    });

    return this;
  }
}

Record.init(_database2js2.default);

exports. default = Record;
