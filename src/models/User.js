import { Model, DataTypes } from 'sequelize';
import db from '../config/database1.js';

class User extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      login: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: {
            args: [3, 255],
            msg: 'Campo login deve ter entre 3 e 255 caracteres',
          },
        },
      },
      password: {
        type: DataTypes.VIRTUAL,
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

User.init(db); //ISSO FAZ TODA A DIFERENÇA

export default User;