"use strict";Object.defineProperty(exports, "__esModule", {value: true});
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql',
  dialectModule: require('mysql2'),
  timezone: '-03:00', // Definindo o timezone
    dialectOptions: {
        dateStrings: true,
        typeCast: function (field, next) { // Cast date fields to string
            if (field.type === 'DATETIME') {
                return field.string();
            }
            return next();
        },
    },
    logging: false, // Desativa logging, opcional
});

try {
  sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

exports. default = sequelize;
