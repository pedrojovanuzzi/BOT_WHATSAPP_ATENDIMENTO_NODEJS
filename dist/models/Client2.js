"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _sequelize = require('sequelize');
var _database1js = require('../config/database1.js'); var _database1js2 = _interopRequireDefault(_database1js);

class Client2 extends _sequelize.Model {
  static init(sequelize) {
    super.init({
        id: {
            type: _sequelize.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nome: _sequelize.DataTypes.STRING,
        login: _sequelize.DataTypes.STRING,
        endereco: _sequelize.DataTypes.STRING,
        numero: _sequelize.DataTypes.STRING,
        cpf_cnpj: _sequelize.DataTypes.STRING,
        celular: _sequelize.DataTypes.STRING,
        aceita_enviar: _sequelize.DataTypes.ENUM('sim', 'não')
    }, {
      sequelize,
      modelName: 'Client2',
      tableName: 'clientes', // Substitua pelo nome da sua tabela
      timestamps: true,
    });

    return this;
  }
}

Client2.init(_database1js2.default);

exports. default = Client2;
