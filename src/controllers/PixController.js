import Record from '../models/Record.js';
import EfiPay from "sdk-node-apis-efi";
import dotenv from 'dotenv';
import crypto from'crypto';
import path from 'path';
import fs from 'fs';
import Sis_Cliente from '../models/Client.js';



dotenv.config();

const logFilePath = path.join(__dirname, 'log.json');



const options = {
    // PRODUÇÃO = false
    // HOMOLOGAÇÃO = true
    sandbox: false,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    certificate: 'src/controllers/cert.p12',
}

const chave_pix = '6a1701ab-f59f-47c1-98b4-7e4941b533fe';

class PixController{
    constructor() {
        // Bind methods to the instance
        this.AlterarWebhook = this.AlterarWebhook.bind(this);
        this.gerarPix = this.gerarPix.bind(this);
        this.gerarPixAll = this.gerarPixAll.bind(this);
        this.StatusUpdatePixTodosVencidos = this.StatusUpdatePixTodosVencidos.bind(this);
        this.gerarPixAberto = this.gerarPixAberto.bind(this);
    }



    AlterarWebhook(url, chave) {
        options['validateMtls'] = false;

        console.log('URL: ' + url);
        console.log('CHAVE: ' + chave);

        let body2 = {
            webhookUrl: String(url),
        };

        let params2 = {
            chave: String(chave),
        };

        const efipay = new EfiPay(options);

        efipay.pixConfigWebhook(params2, body2)
            .then((resposta) => {
                console.log(resposta);
            })
            .catch((error) => {
                console.log(error);
            });
    }

    async StatusUpdatePixTodosVencidos(req, res) {
        res.status(200).end();
        console.log(req.body, req.params);
        console.log('PixTodosVencidos/webhook/pix');
    
        const pixData = req.body.pix;
    
        if (!pixData || pixData.length === 0) {
            console.log('No pix data found');
            return;
        }
    
        const { txid } = pixData[0];
    
        let params = {
            txid: txid,
        };
    
        const efipay = new EfiPay(options);
    
        let pix;
        try {
            pix = await efipay.pixDetailCharge(params);
        } catch (error) {
            console.log('Error in pixDetailCharge:', error);
        }
    
        if (!pix) {
            try {
                pix = await efipay.pixDetailDueCharge(params);
            } catch (error) {
                console.log('Error in pixDetailDueCharge:', error);
            }
        }
    
        if (!pix) {
            console.log('No pix details found for txid:', txid);
            return;
        }
    
        const status = pix.status;
        const data = new Date();
        const statusMK = 'pago';
        const updates = [];
        let qrCodeLink = '';
    
        pix.infoAdicionais.forEach((info, index) => {
            if (info.nome === 'QR' && info.valor) {
                qrCodeLink = info.valor;
            }
    
            if (info.nome === 'ID' && pix.infoAdicionais[index + 1] && pix.infoAdicionais[index + 1].nome === 'VALOR') {
                const idValor = info.valor;
                const valor = pix.infoAdicionais[index + 1].valor;
    
                if (valor !== undefined && valor !== 'undefined') {
                    updates.push({ idValor, valor });
                }
            }
        });
    
        console.log('QR Code Link: ', qrCodeLink);
        console.log(pix);
    
        if (status === 'CONCLUIDA') {
            try {
                for (const update of updates) {
                    console.log("Status: " + status);
                    console.log("idValor: " + update.idValor);
                    console.log("Valor: " + update.valor);
    
                    const record = await Record.update(
                        {
                            status: statusMK,
                            valorpag: update.valor,
                            datapag: data,
                            coletor: 'api_mk_pedro',
                            formapag: 'pix_pedro_api'
                        },
                        {
                            where: { id: update.idValor }
                        }
                    );
                    console.log(record);

                    const record_pppoe = await Record.findOne({where: {id: update.idValor}});

                    const sis_cliente = await Sis_Cliente.findOne({where: {login: record_pppoe.dataValues.login}})

                    const moment = require('moment');

                    // Pegue a data atual
                    let dataAtual = moment();

                    // Adicione 1 dias
                    dataAtual.add(1, 'days');

                    // Formate a data no formato desejado
                    let dataFormatada = dataAtual.format('YYYY-MM-DD HH:mm:ss.SSS');


                    const sis_update = await Sis_Cliente.update({observacao: "sim", rem_obs: dataFormatada}, {where: {login: sis_cliente.dataValues.login}});

                }

            } catch (error) {
                console.log(error);
            }
        }
    }
    
    

    async gerarPixAberto(req, res){
        let {pppoe, cpf} = req.body;

        cpf = cpf.replace(/\D/g, '');

        console.log(req.body);

        const cliente = await Record.findOne({where: {login: pppoe, status: "aberto", datadel: null}, order: [['datavenc', 'ASC']],});

        if(!cliente){
            req.flash('errors', 'Usuario não encontrado ou Não tem Mensalidades Vencidas');
            req.session.save(() => {
                res.redirect('back');
            })
        }
        // console.log(cliente);


        const sis_cliente = await Sis_Cliente.findOne({where: {login: pppoe, cpf_cnpj: cpf}});

        if(!sis_cliente){
            req.flash('errors', 'Usuario não encontrado, verifique se digitou corretamente o PPPOE e cpf');
            req.session.save(() => {
                res.redirect('back');
            })
        }

        let corpo = {
            tipoCob: 'cob',
        }
        
        const efipayLoc = new EfiPay(options)
        
         const loc = await efipayLoc.pixCreateLocation([], corpo)
            .then()
            .catch((error) => {
                console.log(error)
            });


        const locID = loc.id;


        console.log(locID);
        
        const efipayLocLink = new EfiPay(options);

       const qrlink = await efipayLocLink.pixGenerateQRCode({id: String(locID)})
        .then()
        .catch((error) => {
            console.log(error)
        })


        const link = qrlink.linkVisualizacao;

        const desconto = sis_cliente.dataValues.desconto;

        console.log('Desconto ' + desconto);


        let valor = Number(cliente.dataValues.valor);
        const dataVenc = cliente.dataValues.datavenc;
        let id = cliente.dataValues.id;
        

        valor -= desconto;
        
        valor = Number(valor.toFixed(2));

        fs.readFile(logFilePath, 'utf8', (err, data) => {
            let logs = [];
            if (err && err.code === 'ENOENT') {
                console.log('Arquivo de log não encontrado, criando um novo.');
            } else if (err) {
                console.error('Erro ao ler o arquivo de log:', err);
                return;
            } else {
                try {
                    logs = JSON.parse(data);
                    if (!Array.isArray(logs)) {
                        logs = [];
                    }
                } catch (parseErr) {
                    console.error('Erro ao analisar o arquivo de log:', parseErr);
                    logs = [];
                }
            }
        

            const log = {
                tipo: "ULTIMO PIX EM ABERTO",
                cpf: cpf,
                pppoe: pppoe,
                id: id,
                valor: valor,
                dataVenc: dataVenc,
                timestamp: new Date().toISOString()
            }    

            logs.push(log);

            const jsonString = JSON.stringify(logs, null, 2);

            fs.writeFile(logFilePath, jsonString, 'utf8', (err) => {
                if (err) {
                    console.error('Erro ao escrever no arquivo de log:', err);
                    return;
                }
                console.log('Log atualizado com sucesso!');
            });
        });



        const efipay = new EfiPay(options);

        console.log(id);

        if (typeof valor !== "string") {
            valor = valor.toFixed(2);
        } else {
            // Se valor for uma string, converta-o para número antes de chamar toFixed
            valor = Number(valor).toFixed(2);
        }


        console.log("VALOR: " + valor);

        let body;

        if(cpf.length === 11){
            body = {
                calendario: {
                    expiracao: 43200
                },
                devedor: {
                    cpf: cpf,
                    nome: pppoe
                },
                valor: {
                    original: valor
                },
                chave: chave_pix,
                solicitacaoPagador: "Mensalidade",
                infoAdicionais: [
                    {
                        nome: "ID",
                        valor: String(id)
                    },
                    {
                        nome: "VALOR",
                        valor: String(valor)
                    },
                    {
                        nome: "QR",
                        valor: String(link)
                    }
                ],
                loc:{
                    id: locID
                }
                
            }
        }
        else{
            body = {
                calendario: {
                    expiracao: 43200
                },
                devedor: {
                    cnpj: cpf,
                    nome: pppoe
                },
                valor: {
                    original: valor
                },
                chave: chave_pix,
                solicitacaoPagador: "Mensalidade",
                infoAdicionais: [
                    {
                        nome: "ID",
                        valor: String(id)
                    },
                    {
                        nome: "VALOR",
                        valor: String(valor)
                    },
                    {
                        nome: "QR",
                        valor: String(link)
                    }
                ],
                loc:{
                    id: locID
                }
                
            }
        }

        

        let params = {
            txid: crypto.randomBytes(16).toString('hex'),
        }

        let pix = await efipay.pixCreateCharge(params, body)
            .then()
            .catch((error) => {
                console.log(error)
            });

            console.log(pix);

            let pix_code = pix.pixCopiaECola;

        res.render('pix', {valor, pppoe, link, dataVenc});
    }

    async gerarPix(req, res){
        let {pppoe, cpf} = req.body;

        cpf = cpf.replace(/\D/g, '');

        console.log(req.body);

        const cliente = await Record.findOne({where: {login: pppoe, status: "vencido", datadel: null}, order: [['datavenc', 'ASC']],});

        if(!cliente){
            req.flash('errors', 'Usuario não encontrado ou Não tem Mensalidades Vencidas');
            req.session.save(() => {
                res.redirect('back');
            })
        }

        const sis_cliente = await Sis_Cliente.findOne({where: {login: pppoe, cpf_cnpj: cpf}});

        if(!sis_cliente){
            req.flash('errors', 'Usuario não encontrado, verifique se digitou corretamente o PPPOE e cpf');
            req.session.save(() => {
                res.redirect('back');
            })
        }

        let corpo = {
            tipoCob: 'cob',
        }
        
        const efipayLoc = new EfiPay(options)
        
         const loc = await efipayLoc.pixCreateLocation([], corpo)
            .then()
            .catch((error) => {
                console.log(error)
            });


        const locID = loc.id;


        console.log(locID);
        
        const efipayLocLink = new EfiPay(options);

       const qrlink = await efipayLocLink.pixGenerateQRCode({id: String(locID)})
        .then()
        .catch((error) => {
            console.log(error)
        })


        const link = qrlink.linkVisualizacao;

        const desconto = sis_cliente.dataValues.desconto;

        console.log('Desconto ' + desconto);


        let valor = Number(cliente.dataValues.valor);
        const dataVenc = cliente.dataValues.datavenc;
        let id = cliente.dataValues.id;
        

        valor -= desconto;

        const dataHoje = new Date();

        function resetTime(date) {
            date.setHours(0, 0, 0, 0);
            return date;
        }
        
        let dataVencSemHora = resetTime(new Date(dataVenc));
        let dataHojeSemHora = resetTime(new Date(dataHoje));


        console.log("Data de hoje" + dataHoje, "Data de VENCIMENTO" + dataVenc);

        if (dataVencSemHora > dataHojeSemHora) {
            console.log("Não está em atraso");
        } else if (dataVencSemHora < dataHojeSemHora) {
            console.log("está em atraso");

            valor = Number(valor.toFixed(2));
            

            const date1 = new Date(dataVenc);
            const date2 = new Date(dataHoje);

        

        // Função para calcular a diferença em dias
        function differenceInDays(date1, date2) {
            const oneDay = 24 * 60 * 60 * 1000;
            const diffDays = Math.floor(Math.abs((date1 - date2) / oneDay));
            return diffDays;
        }


        const diffInDays = differenceInDays(date1, date2);

        // Definindo as multas
        const monthlyFine = 0.02; // 2% por mês
        const dailyFine = 0.00033; // 0.033% por dia

       // Calculando a multa mensal
        let multaMensal = valor * (monthlyFine);

        // Calculando a multa diária
        let multaDiaria = valor * ((diffInDays - 4) * dailyFine);

        // Somando as multas ao valor original
        let valorFinal = valor + multaMensal + multaDiaria;

        console.log("DIAS: " + diffInDays);
        console.log("VALOR: " + valorFinal, valor, multaMensal, multaDiaria);

        // Arredondando o valor final para cima até duas casas decimais
        let valorFinalArredondado = Math.floor(valorFinal * 100) / 100;

        let valorFinalFormatado = valorFinalArredondado.toFixed(2);


       valor = valorFinalFormatado;
            
        } else if(dataVencSemHora === dataHojeSemHora){
            console.log("Vence Hoje");
        }


        fs.readFile(logFilePath, 'utf8', (err, data) => {
            let logs = [];
            if (err && err.code === 'ENOENT') {
                console.log('Arquivo de log não encontrado, criando um novo.');
            } else if (err) {
                console.error('Erro ao ler o arquivo de log:', err);
                return;
            } else {
                try {
                    logs = JSON.parse(data);
                    if (!Array.isArray(logs)) {
                        logs = [];
                    }
                } catch (parseErr) {
                    console.error('Erro ao analisar o arquivo de log:', parseErr);
                    logs = [];
                }
            }
        

            const log = {
                tipo: "ULTIMO PIX VENCIDO",
                cpf: cpf,
                pppoe: pppoe,
                id: id,
                valor: valor,
                dataVenc: dataVenc,
                timestamp: new Date().toISOString()
            }

            logs.push(log);

            const jsonString = JSON.stringify(logs, null, 2);

            fs.writeFile(logFilePath, jsonString, 'utf8', (err) => {
                if (err) {
                    console.error('Erro ao escrever no arquivo de log:', err);
                    return;
                }
                console.log('Log atualizado com sucesso!');
            });
        });

        

        const efipay = new EfiPay(options);

        if (typeof valor !== "string") {
            valor = valor.toFixed(2);
        } else {
            // Se valor for uma string, converta-o para número antes de chamar toFixed
            valor = Number(valor).toFixed(2);
        }

        console.log(id);

        let body;
        

        console.log(cpf);

        if(cpf.length === 11){
            body = {
                calendario: {
                    expiracao: 43200
                },
                devedor: {
                    cpf: cpf,
                    nome: pppoe
                },
                valor: {
                    original: valor
                },
                chave: chave_pix,
                solicitacaoPagador: "Mensalidade",
                infoAdicionais: [
                    {
                        nome: "ID",
                        valor: String(id)
                    },
                    {
                        nome: "VALOR",
                        valor: String(valor)
                    }
                    ,
                    {
                        nome: "QR",
                        valor: String(link)
                    }
                ],
                loc:{
                    id: locID
                }
            }
        }
        else{
            body = {
                calendario: {
                    expiracao: 43200
                },
                devedor: {
                    cnpj: cpf,
                    nome: pppoe
                },
                valor: {
                    original: valor
                },
                chave: chave_pix,
                solicitacaoPagador: "Mensalidade",
                infoAdicionais: [
                    {
                        nome: "ID",
                        valor: String(id)
                    },
                    {
                        nome: "VALOR",
                        valor: String(valor)
                    }
                    ,
                    {
                        nome: "QR",
                        valor: String(link)
                    }
                ],
                loc:{
                    id: locID
                }
            }
        }
        



        let params = {
            txid: crypto.randomBytes(16).toString('hex'),
        }

        let pix = await efipay.pixCreateCharge(params, body)
            .then()
            .catch((error) => {
                console.log(error)
            });

            console.log(pix);

            let pix_code = pix.pixCopiaECola;

            const options2 = { month: '2-digit', day: '2-digit' };
            const formattedDate = new Intl.DateTimeFormat('pt-BR', options2).format(dataVenc);

        res.render('pix', {valor, pppoe, link, formattedDate});
    }

    async gerarPixAll(req, res){
        let {pppoe, cpf} = req.body;

        cpf = cpf.replace(/\D/g, '');

        console.log(req.body);

        const cliente = await Record.findAll({
            where: {
                login: pppoe,     // Certifique-se de que 'pppoe' é uma variável definida ou coloque entre aspas se for um valor fixo
                status: "vencido",
                datadel: null
            },
            order: [['datavenc', 'ASC']],
            limit: 3   // Limita a busca aos três primeiros registros que correspondem ao critério
        });

        if (!cliente || cliente.length === 0) {
            req.flash('errors', 'Usuario não encontrado ou Não tem Mensalidades Vencidas');
            req.session.save(() => {
                res.redirect('back');
            });
        }


        const sis_cliente = await Sis_Cliente.findOne({where: {login: pppoe, cpf_cnpj: cpf}});

        if(!sis_cliente){
            req.flash('errors', 'Usuario não encontrado, verifique se digitou corretamente o PPPOE e cpf');
            req.session.save(() => {
                res.redirect('back');
            })
        }


        let corpo = {
            tipoCob: 'cob',
        }
        
        const efipayLoc = new EfiPay(options)
        
         const loc = await efipayLoc.pixCreateLocation([], corpo)
            .then()
            .catch((error) => {
                console.log(error)
            });


        const locID = loc.id;


        console.log(locID);
        
        const efipayLocLink = new EfiPay(options);

       const qrlink = await efipayLocLink.pixGenerateQRCode({id: String(locID)})
        .then()
        .catch((error) => {
            console.log(error)
        })


        const link = qrlink.linkVisualizacao;

        const desconto = sis_cliente.dataValues.desconto;
        

        function resetTime(date) {
            date.setHours(0, 0, 0, 0);
            return date;
        }
        
        

        // console.log(cliente);
        // console.log(cliente);

        
        let structuredData = cliente.map(client => {
            return{
                valor: Number(client.dataValues.valor), // Convertendo a string de valor para número
                dataVenc: client.dataValues.datavenc,   // Mantendo a data de vencimento como está
                id: client.dataValues.id              // Mantendo o ID como está
            }
        })

        const dataHoje = new Date();  // A data de hoje


        structuredData = structuredData.map((cliente, index) => {


            // Convertendo a data de vencimento para objeto Date se necessário
            const dataVenc = new Date(cliente.dataVenc);
            
            // Aplica o desconto de 50% na terceira mensalidade
            if (index === 2) { // Supondo que a terceira mensalidade está no índice 2 (0, 1, 2)
                cliente.valor *= 0.5; // 50% do valor original
                cliente.valor = Math.floor(cliente.valor);
            }

            let dataVencSemHora = resetTime(new Date(dataVenc));
            let dataHojeSemHora = resetTime(new Date(dataHoje));
        
            // Verificar se está em atraso e calcular as multas
            if (dataVencSemHora < dataHojeSemHora) {
                // Aplica multa inicial de 2%
                console.log("Desconto: " + desconto);

                cliente.valor -= desconto;

                cliente.valor = Number(cliente.valor.toFixed(2));
        

                const differenceInDays = (date1, date2) => {
                    const oneDay = 24 * 60 * 60 * 1000;
                    const diffDays = Math.floor(Math.abs((date1 - date2) / oneDay));
                    return diffDays;
                };
        

                const diffInDays = differenceInDays(dataHoje, cliente.dataVenc);

                // Definindo as multas
                const monthlyFine = 0.02; // 2% por mês
                const dailyFine = 0.00033; // 0.033% por dia

            // Calculando a multa mensal
                let multaMensal = cliente.valor * (monthlyFine);

                // Calculando a multa diária
                let multaDiaria = cliente.valor * ((diffInDays - 4) * dailyFine);

                // Somando as multas ao valor original
                let valorFinal = cliente.valor + multaMensal + multaDiaria;

                // Arredondando o valor final para cima até duas casas decimais
                let valorFinalArredondado = Math.floor(valorFinal * 100) / 100;

                let valorFinalFormatado = valorFinalArredondado.toFixed(2);

                cliente.valor = valorFinalFormatado;
            }
        
            return cliente; // Retorna o cliente com as modificações aplicadas
        });

        
        console.log(structuredData);

        let valorSomado = 0;

        structuredData.forEach((cliente) => {
            valorSomado += Number(cliente.valor);
        });
        

        valorSomado = Number(valorSomado);
        valorSomado = valorSomado.toFixed(2);

        console.log(valorSomado);


        fs.readFile(logFilePath, 'utf8', (err, data) => {
            let logs = [];
            if (err && err.code === 'ENOENT') {
                console.log('Arquivo de log não encontrado, criando um novo.');
            } else if (err) {
                console.error('Erro ao ler o arquivo de log:', err);
                return;
            } else {
                try {
                    logs = JSON.parse(data);
                    if (!Array.isArray(logs)) {
                        logs = [];
                    }
                } catch (parseErr) {
                    console.error('Erro ao analisar o arquivo de log:', parseErr);
                    logs = [];
                }
            }
        

            const log = {
                tipo: "SOMA DAS MENSALIDADES VENCIDAS!",
                cpf: cpf,
                pppoe: pppoe,
                structuredData,
                timestamp: new Date().toISOString()
            }

            logs.push(log);

            const jsonString = JSON.stringify(logs, null, 2);

            fs.writeFile(logFilePath, jsonString, 'utf8', (err) => {
                if (err) {
                    console.error('Erro ao escrever no arquivo de log:', err);
                    return;
                }
                console.log('Log atualizado com sucesso!');
            });
        });


        const efipay = new EfiPay(options);

        // console.log(id);

        let body;

        if(cpf.length === 11){
            body = {
                calendario: {
                    expiracao: 43200
                },
                devedor: {
                    cpf: cpf,
                    nome: pppoe
                },
                valor: {
                    original: valorSomado
                },
                chave: chave_pix,
                solicitacaoPagador: "Mensalidade",
                infoAdicionais: [
                    {
                        nome: "QR",
                        valor: link
                    },
                ],
                loc: {
                    id: locID
                }
            }
        }
        else{
            body = {
                calendario: {
                    expiracao: 43200
                },
                devedor: {
                    cnpj: cpf,
                    nome: pppoe
                },
                valor: {
                    original: valorSomado
                },
                chave: chave_pix,
                solicitacaoPagador: "Mensalidade",
                infoAdicionais: [
                    {
                        nome: "QR",
                        valor: link
                    },
                ],
                loc: {
                    id: locID
                }
            }
        }

        

        let params = {
            txid: crypto.randomBytes(16).toString('hex'),
        }

        structuredData.forEach(cliente => {
            body.infoAdicionais.push({
                nome: "ID",
                valor: String(cliente.id)
            });
            body.infoAdicionais.push({
                nome: "VALOR",
                valor: String(cliente.valor)
            });
        });
        
        console.log(body); // Exibe o body para verificação

        let pix = await efipay.pixCreateCharge(params, body)
            .then()
            .catch((error) => {
                console.log(error)
            });

            console.log(pix);

            let pix_code = pix.pixCopiaECola;

            let valor = valorSomado;

        res.render('pix', {valor, pppoe, link, structuredData});
    }

}
export default new PixController();