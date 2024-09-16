"use strict";Object.defineProperty(exports, "__esModule", {value: true});
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize(process.env.DATABASE_API, process.env.DATABASE_USERNAME_API, process.env.DATABASE_PASSWORD_API, {
  host: process.env.DATABASE_HOST_API,
  dialect: 'mariadb',
  dialectModule: require('mariadb'),
  logging: false
});


try {
  sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

exports. default = sequelize;
