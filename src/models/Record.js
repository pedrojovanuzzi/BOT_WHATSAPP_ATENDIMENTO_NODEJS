import { Model, DataTypes } from 'sequelize';
import db from '../config/database2.js';

class Record extends Model {
  static init(sequelize) {
    super.init({
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      datavenc: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nossonum: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
      datapag: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nome: {
        type: DataTypes.STRING(16),
        allowNull: true,
      },
      recibo: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      status: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: 'aberto',
      },
      login: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tipo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      cfop_lanc: {
        type: DataTypes.STRING(8),
        allowNull: true,
        defaultValue: '5307',
      },
      obs: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      processamento: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      aviso: {
        type: DataTypes.STRING(3),
        allowNull: true,
        defaultValue: 'nao',
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      usergerou: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      valorger: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'completo',
      },
      coletor: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      linhadig: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      valor: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      valorpag: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      gwt_numero: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      imp: {
        type: DataTypes.ENUM('sim', 'nao'),
        allowNull: false,
        defaultValue: 'nao',
      },
      referencia: {
        type: DataTypes.STRING(8),
        allowNull: true,
      },
      tipocob: {
        type: DataTypes.ENUM('fat', 'car'),
        allowNull: false,
        defaultValue: 'fat',
      },
      codigo_carne: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      chave_gnet: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      chave_gnet2: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      chave_bfacil: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      chave_juno: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      chave_galaxpay: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      chave_iugu: {
        type: DataTypes.STRING(96),
        allowNull: true,
      },
      numconta: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      gerourem: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      remvalor: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      remdata: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      formapag: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fcartaobandeira: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fcartaonumero: {
        type: DataTypes.STRING(32),
        allowNull: true,
      },
      fchequenumero: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fchequebanco: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      fchequeagcc: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      percmulta: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      valormulta: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      percmora: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      valormora: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      percdesc: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      valordesc: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      deltitulo: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      datadel: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      num_recibos: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      num_retornos: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      alt_venc: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      uuid_lanc: {
        type: DataTypes.STRING(48),
        allowNull: true,
      },
      tarifa_paga: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0.00,
      },
      id_empresa: {
        type: DataTypes.STRING(16),
        allowNull: true,
        unique: true,
      },
      oco01: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      oco02: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      oco06: {
        type: DataTypes.TINYINT,
        allowNull: true,
        defaultValue: 0,
      },
      codigo_barras: {
        type: DataTypes.STRING(64),
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

Record.init(db);

export default Record;
