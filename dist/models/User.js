"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _sequelize = require('sequelize');
var _database1js = require('../config/database1.js'); var _database1js2 = _interopRequireDefault(_database1js);

class User extends _sequelize.Model {
  static init(sequelize) {
    super.init({
      id: {
        type: _sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      login: {
        type: _sequelize.DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [3, 255],
            msg: 'Campo login deve ter entre 3 e 255 caracteres',
          },
        },
      },
      password: {
        type: _sequelize.DataTypes.VIRTUAL,
        allowNull: true,
        validate: {
          len: {
            args: [6, 50],
            msg: 'A senha precisa ter entre 6 e 50 caracteres',
          },
        },
      },
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: false,
    });


    return this;
  }

}

User.init(_database1js2.default); //ISSO FAZ TODA A DIFERENÇA

exports. default = User;