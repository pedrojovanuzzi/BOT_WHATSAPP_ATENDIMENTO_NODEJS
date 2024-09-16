import { Model, DataTypes } from 'sequelize';
import db from '../config/database1.js';

class Client2 extends Model {
  static init(sequelize) {
    super.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nome: DataTypes.STRING,
        login: DataTypes.STRING,
        endereco: DataTypes.STRING,
        numero: DataTypes.STRING,
        cpf_cnpj: DataTypes.STRING,
        celular: DataTypes.STRING,
        aceita_enviar: DataTypes.ENUM('sim', 'não')
    }, {
      sequelize,
      modelName: 'Client2',
      tableName: 'clientes', // Substitua pelo nome da sua tabela
      timestamps: true,
    });

    return this;
  }
}

Client2.init(db);

export default Client2;
