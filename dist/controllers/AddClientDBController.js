"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }var _nodecron = require('node-cron'); var _nodecron2 = _interopRequireDefault(_nodecron);
var _Clientjs = require('../models/Client.js'); var _Clientjs2 = _interopRequireDefault(_Clientjs);
var _Client2js = require('../models/Client2.js'); var _Client2js2 = _interopRequireDefault(_Client2js);

class AddClientDBController{

    constructor(){
        this.adicionaCliente = this.adicionaCliente.bind(this);
        _nodecron2.default.schedule('0 * */1 * *', this.adicionaCliente);
    }
    
    async adicionaCliente(){
        console.log("rodando");
        
        const client = await _Clientjs2.default.findAll({attributes: ["nome", "login", "endereco", "numero", "cpf_cnpj", "celular"], where: {cli_ativado: "s"}});
       
        
        client.map(async (cliente) => {
            const client_API = await _Client2js2.default.findOne({where: {login : cliente.dataValues.login}});
            
            if(client_API == null){
                
                await _Client2js2.default.create({nome: cliente.dataValues.nome, login: cliente.dataValues.login, endereco: cliente.dataValues.endereco, numero: cliente.dataValues.numero,
                cpf_cnpj: cliente.dataValues.cpf_cnpj, celular: cliente.dataValues.celular, aceita_enviar: "sim"});
            }
            else if(client_API != null){
                
            }
        })

    }
}

exports. default = new AddClientDBController();