import cron from "node-cron";
import Client from "../models/Client.js";
import Client2 from "../models/Client2.js";

class AddClientDBController{

    constructor(){
        this.adicionaCliente = this.adicionaCliente.bind(this);
        cron.schedule('0 * */1 * *', this.adicionaCliente);
    }
    
    async adicionaCliente(){
        console.log("rodando");
        
        const client = await Client.findAll({attributes: ["nome", "login", "endereco", "numero", "cpf_cnpj", "celular"], where: {cli_ativado: "s"}});
       
        
        client.map(async (cliente) => {
            const client_API = await Client2.findOne({where: {login : cliente.dataValues.login}});
            
            if(client_API == null){
                
                await Client2.create({nome: cliente.dataValues.nome, login: cliente.dataValues.login, endereco: cliente.dataValues.endereco, numero: cliente.dataValues.numero,
                cpf_cnpj: cliente.dataValues.cpf_cnpj, celular: cliente.dataValues.celular, aceita_enviar: "sim"});
            }
            else if(client_API != null){
                
            }
        })

    }
}

export default new AddClientDBController();