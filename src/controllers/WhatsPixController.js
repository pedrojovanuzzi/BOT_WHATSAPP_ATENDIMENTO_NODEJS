import Record from '../models/Record.js';
import Sis_Cliente from '../models/Client.js';
import Client2 from '../models/Client2.js';
import EfiPay from "sdk-node-apis-efi";
import dotenv from 'dotenv';
import crypto from'crypto';
import WhatsApp from 'whatsapp';
import { text } from 'express';
import { log } from 'console';
import path from 'path';
import fs, { cp } from 'fs';
import { or, where } from 'sequelize';
import { Op } from 'sequelize';
import cron from 'node-cron';
import Client from '../models/Client.js';
import nodemailer from "nodemailer";
import axios from "axios";
import SftpClient from "ssh2-sftp-client";
import FormData from "form-data";

dotenv.config();


const logFilePath = path.join(__dirname, 'log.json');
const logMsgFilePath = path.join(__dirname, 'msg.json');


// Your test sender phone number

const url = `https://graph.facebook.com/v20.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
const urlMedia = `https://graph.facebook.com/v20.0/${process.env.WA_PHONE_NUMBER_ID}/media`;

const options = {
    // PRODUÇÃO = false
    // HOMOLOGAÇÃO = true
    sandbox: false,
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
    certificate: 'src/controllers/cert.p12',
}


const token = process.env.CLOUD_API_ACCESS_TOKEN;
const sessions = {};

const manutencao = false;

// CTRL + K + CTRL + 0 MINIMIZA TODAS AS FUNÇÕES


const chave_pix = '6a1701ab-f59f-47c1-98b4-7e4941b533fe';

// cron.schedule('*/10 * * * * *', () => {
//     console.log("Clientes Ativos: " + this.getActiveSessionsCount());
// })

class WhatsPixController{
    constructor(){
        this.index = this.index.bind(this);
        this.enviarMensagemVencimento = this.enviarMensagemVencimento.bind(this);
        this.boasVindas = this.boasVindas.bind(this);
        this.PodeMePassarOCpf = this.PodeMePassarOCpf.bind(this);
        this.validarCPF = this.validarCPF.bind(this);
        this.validarRG = this.validarRG.bind(this);
        this.MensagensComuns = this.MensagensComuns.bind(this);
        this.enviarBoleto = this.enviarBoleto.bind(this);
        this.handleMessage = this.handleMessage.bind(this);

        this.verificaType = this.verificaType.bind(this);
        this.getActiveSessionsCount = this.getActiveSessionsCount.bind(this);
        this.formatarData = this.formatarData.bind(this);
        this.resetInactivityTimer = this.resetInactivityTimer.bind(this);
        this.downloadPdfFromSftp = this.downloadPdfFromSftp.bind(this);
        this.MensagensDeMidia = this.MensagensDeMidia.bind(this);
        this.getMediaID = this.getMediaID.bind(this);
        
        this.MensagemBotao = this.MensagemBotao.bind(this);
        this.MensagemLista = this.MensagemLista.bind(this);
        this.MensagemTermos = this.MensagemTermos.bind(this);
        this.iniciarCadastro = this.iniciarCadastro.bind(this);
        this.LGPD = this.LGPD.bind(this);
        this.Privacidade = this.Privacidade.bind(this);
        this.iniciarMudancaComodo = this.iniciarMudancaComodo.bind(this);


    }

    async index(req, res) {
        // console.log('Webhook recebido');
        // console.log(req.body);
    
        const body = req.body;
    
        if (body.entry && body.entry[0].changes) {
            const changes = body.entry[0].changes;

            if (changes && Array.isArray(changes) && changes.length > 0) {
                const messages = changes[0].value.messages;

                console.log(messages);

                // const celular = process.env.TEST_PHONE; // Para testes, mantenha fixo
                const celular = messages ? messages[0].from : undefined;
                const type = messages ? messages[0].type : undefined;

                if (!celular || !type) {
                    res.sendStatus(200); // Responder ao webhook mesmo que não haja um número de celular
                    return;
                }

                console.log(type + " TIPO DA MENSAGEM");
                
        
                // Inicializa a sessão se não existir
                if (!sessions[celular]) {
                    sessions[celular] = { stage: '' };
                }
        
                const session = sessions[celular];
                // console.log(`Sessão atual para ${celular}:`, session);
                let mensagemCorpo;

                if(type === "interactive"){
                    const interactive = messages[0].interactive;

                    // Verifica se o tipo é 'button_reply' e exibe o objeto completo de 'button_reply'
                    if (interactive.type === 'button_reply') {
                        const buttonReply = interactive.button_reply;
                        console.log('button_reply object:', buttonReply); // Exibe o objeto completo de 'button_reply'
                        mensagemCorpo = buttonReply.title;
                    }

                    if(interactive.type === "list_reply"){
                        const listReply = interactive.list_reply;
                        console.log('list_reply object:', listReply); 
                        mensagemCorpo = listReply.title;
                    }

                }
                else{
                    mensagemCorpo = messages?.[0]?.text?.body;
                }

                


                if (mensagemCorpo || type) {
                    const texto = mensagemCorpo;
                    console.log(`Texto recebido: ${texto}, Celular: ${celular}`);
                    console.log("Tipo do Texto: " + typeof(texto));
                    

                    if(type === "undefined" || type === undefined){
                        console.log(`Type undefined ignorado`);
                        res.sendStatus(200); // Resposta para o webhook
                        return;
                    }


                    fs.readFile(logMsgFilePath, 'utf8', (err, data) => {
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
                            messages: messages,
                            timestamp: new Date().toISOString()
                        }
                        
            
                        logs.push(log);
            
                        const jsonString = JSON.stringify(logs, null, 2);
            
                        fs.writeFile(logMsgFilePath, jsonString, 'utf8', (err) => {
                            if (err) {
                                console.error('Erro ao escrever no arquivo de log:', err);
                                return;
                            }
                            console.log('Log atualizado com sucesso!');
                        });
                    });
    

                    
                
                this.handleMessage(session, texto, celular, type, manutencao);


            }
            res.sendStatus(200); // Resposta para o webhook

        }

        }
    }


    getActiveSessionsCount() {
        return Object.keys(sessions).length;
        
    }

    resetInactivityTimer(celular, session) {
        if (session.inactivityTimer) {
            clearTimeout(session.inactivityTimer);
        }
    
        session.inactivityTimer = setTimeout(() => {
            this.MensagensComuns(celular, "🤷🏻 Seu atendimento foi *finalizado* devido à inatividade!!\nEntre em contato novamente 👍");
            delete sessions[celular];
        }, 900000); // 15 minutos de inatividade
    }

    async handleMessage(session, texto, celular, type, manutencao) {
       if(manutencao == true && celular != process.env.TEST_PHONE){
        this.MensagensComuns(celular, "Olá, no momento nosso Bot está em Manutenção ⚙, tente novamente mais tarde!")
       }
       else{
        this.resetInactivityTimer.call(this, celular, session);
    
        switch (session.stage) {
            //Inicio
            case '':
                await this.boasVindas(celular);
            
                await this.MensagemBotao(celular, "Escolha a Opção", "Boleto/Pix", "Serviços/Contratação", "Falar com Atendente");
                
                session.stage = 'options_start';
                break;
            case 'options_start':         
                if(this.verificaType(type)){
                    if (texto == '1' || texto == '2' || texto == 'Boleto/Pix') {
                        await this.PodeMePassarOCpf(celular);
                        session.stage = 'awaiting_cpf';
                    }
                    else if(texto == 'Serviços/Contratação'){
                            const campos = {
                                sections: [
                                    {
                                        title: 'Serviços',
                                        rows: [
                                            { id: 'option_1', title: 'Instalação' },
                                            { id: 'option_2', title: 'Mudança de Endereço' },
                                            { id: 'option_3', title: 'Mudança de Cômodo' },
                                            { id: 'option_4', title: 'Troca de Titularidade' },
                                            { id: 'option_5', title: 'Alteração de Plano' }
                                        ]
                                    }
                                ]
                            };
                            await this.MensagemLista(celular, "Escolha um Serviço", campos);
                            await this.MensagensComuns(celular, "Caso deseje voltar a aba inicial, digite *inicio*");
                            session.stage = 'awaiting_service';
                    }
                     else if (texto == '3' || texto == 'Falar com Atendente') {
                        await this.MensagensComuns(celular, "Caso queira falar com um *Atendente*, acesse esse Link das 8 às 20h 👍🏻 https://wa.me/message/C3QNNVFXJWK5A1");
                        await this.MensagensComuns(celular, "👉🏻 Digite *continuar* para terminar o atendimento");
                        session.stage = "end";
                    } else {
                        await this.MensagensComuns(celular, "⚠️ Seleção *Inválida*, Verifique se Digitou o Número Corretamente!!!");
                    }                    
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, *selecione* uma opção válida!!");
                }
                     
                break;
            case 'awaiting_service':
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === 'instalaçao' || texto.toLowerCase() === 'instalação'){
                        await this.LGPD(celular);
                        session.stage = "lgpd_request";
                        session.service = "instalacao";              
                    }
                    else if(texto.toLowerCase() === 'mudança de endereço' || texto.toLowerCase() === 'mudanca de endereco'){
                        await this.LGPD(celular);
                        session.stage = "lgpd_request";
                        session.service = "mudanca_endereco";   
                    }
                    else if(texto.toLowerCase() === 'mudança de cômodo' || texto.toLowerCase() === 'mudanca de comodo'){
                        await this.LGPD(celular);
                        session.stage = "lgpd_request";
                        session.service = "mudanca_comodo";   
                    }
                    else if(texto.toLowerCase() === 'troca de titularidade'){
                        await this.LGPD(celular);
                        session.stage = "lgpd_request";
                        session.service = "troca_titularidade";   
                    }                   
                    else if(texto.toLowerCase() === 'alteração de plano'){
                        await this.LGPD(celular);
                        session.stage = "lgpd_request";
                        session.service = "troca_plano";   
                    }
                    else if(texto.toLowerCase() === 'inicio' || texto.toLowerCase() === 'inicío' || texto.toLowerCase() === 'início'){
                        await this.boasVindas(celular);
                        await this.MensagemBotao(celular, "Escolha a Opção", "Boleto/Pix", "Serviços/Contratação", "Falar com Atendente");
                        session.stage = 'options_start';
                    }
                    else{
                        await this.MensagensComuns(celular, "Opção Invalída, Selecione a Opção da Lista");
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista");
                }
            break;
            case "lgpd_request":  
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === 'sim aceito'){
                        if(session.service === "instalacao"){
                            session.stage = "register";
                            await this.iniciarCadastro(celular, texto, session);
                        }
                        else if(session.service === "mudanca_endereco"){
                            session.stage = "mudanca_endereco";
                            await this.iniciarMudanca(celular, texto, session);
                        }
                        else if(session.service === "mudanca_comodo"){
                            session.stage = "mudanca_comodo";
                            await this.iniciarMudancaComodo(celular, texto, session);
                        }   
                        else if(session.service === "troca_titularidade"){
                            session.stage = "troca_titularidade";
                            await this.MensagemBotao(celular,"Você é o Titular do Cadastro?", "Sim", "Não");                          
                        }                            
                        else if(session.service === "troca_plano"){
                            session.stage = "troca_plano";
                            await this.iniciarTrocaPlano(celular,texto,session);                                                    
                        }            
                    }
                    else if(texto.toLowerCase() === 'não' || texto.toLowerCase() === 'nao'){
                        await this.MensagensComuns(celular, "🥹 *Infelizmente* não poderei mais dar \ncontinuidade ao seu atendimento, *respeitando* a sua vontade.\n🫡Estaremos sempre aqui a sua *disposição*!");
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                    }
                    else{
                        await this.MensagensComuns(celular, "Aperte nos Botoes de Sim ou Não");
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção dos Botoes");
                }
            break;
            case "choose_type_payment":
                if(this.verificaType(type)){
                    if(texto === "Pix" || texto === "Dinheiro" || texto === "Cartão"){
                        if(session.service === "mudanca_endereco"){
                            const pagamento = texto;
                            await this.MensagensComuns(celular, "🫱🏻‍🫲🏼 *Parabéns* estamos quase lá...\nUm de nossos *atendentes* entrará em contato para finalizar a sua *mudança de endereço*\nAtt.: *Wip Telecom*");
                            let dadosCliente = session.dadosCompleto ? JSON.stringify(session.dadosCompleto, null, 2) : "Dados não encontrados";
                            let msg = `*🏠 Mudança de Endereço* \n\n*💰 Forma: Paga com ${pagamento}*\nDados do Cliente: ${dadosCliente}`;
                            await this.MensagensComuns(process.env.TEST_PHONE, msg);
                            clearTimeout(sessions[celular].inactivityTimer);                       
                            delete sessions[celular];    
                        }
                        else if(session.service === "mudanca_comodo"){
                            const pagamento = texto;
                            await this.MensagensComuns(celular, "🫱🏻‍🫲🏼 *Parabéns* estamos quase lá...\nUm de nossos *atendentes* entrará em contato para finalizar a sua *mudança de cômodo*\nAtt.: *Wip Telecom*");
                            let dadosCliente = session.dadosCompleto ? JSON.stringify(session.dadosCompleto, null, 2) : "Dados não encontrados";
                            let msg = `*🧱 Mudança de Cômodo* \n\n*💰 Forma: Paga com ${pagamento}*\nDados do Cliente: ${dadosCliente}`;
                            await this.MensagensComuns(process.env.TEST_PHONE, msg);
                            clearTimeout(sessions[celular].inactivityTimer);                       
                            delete sessions[celular];  
                        }
                    }
                    else{
                        await this.MensagensComuns(celular, "Invalido, aperte em um Botão da lista");
                    }
                    
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista"); 
                }
            break;

            //Cadastro
            case "register":
                await this.iniciarCadastro(celular, texto, session);
            break;
            case "plan":
                if(this.verificaType(type)){
                    let planoEscolhido;
                    if (texto === '🟣 400 MEGA R$ 89,90') {
                        planoEscolhido = '🟣 400 MEGA R$ 89,90';
                    } else if (texto === '🟩 500 MEGA R$ 99,90') {
                        planoEscolhido = '🟩 500 MEGA R$ 99,90';
                    } else if (texto === '🔴 600 MEGA R$ 109,90') {
                        planoEscolhido = '🔴 600 MEGA R$ 109,90';
                    } else if (texto === '🟡 700 MEGA R$ 129,90') {
                        planoEscolhido = '🟡 700 MEGA R$ 129,90';
                    } else if (texto === '🟦 800 MEGA R$ 159,90') {
                        planoEscolhido = '🟦 800 MEGA R$ 159,90';
                    }
                    else if (texto === '⬛ Rural (Consultar)') {
                        planoEscolhido = '⬛ Rural (Consultar)';
                    }
                    else{
                        await this.MensagensComuns(celular, "*Opção Invalida* 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista"); 
                        session.stage = "plan";
                        return;
                    }

                    session.planoEscolhido = planoEscolhido;
                    
                    await this.MensagensComuns(celular, "🗓️ Vamos escolher a *Data* mensal de *Vencimento* da sua fatura!");
                    await this.MensagemLista(celular,"Escolha seu Vencimento",{sections: [
                        {
                            title: 'Escolha seu Vencimento',
                            rows: [
                                { id: 'option_1', title: 'DIA 05' },
                                { id: 'option_2', title: 'DIA 10' },
                                { id: 'option_3', title: 'DIA 15' },
                                { id: 'option_4', title: 'DIA 20' }
                            ]
                        }
                    ]});
                    
                    session.stage = "venc_date";
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista");
                }
            break;
            case "venc_date":
                if(this.verificaType(type)){
                    let vencimentoEscolhido;
                    if (texto === 'DIA 05') {
                        vencimentoEscolhido = 'Dia 05';
                    } else if (texto === 'DIA 10') {
                        vencimentoEscolhido = 'Dia 10';
                    } else if (texto === 'DIA 15') {
                        vencimentoEscolhido = 'Dia 15';
                    } else if (texto === 'DIA 20') {
                        vencimentoEscolhido = 'Dia 20';
                    }
                    else{
                        await this.MensagensComuns(celular, "*Opção Invalida* 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista"); 
                        session.stage = "venc_date";
                        return;
                    }
                    session.vencimentoEscolhido = vencimentoEscolhido;
                    await this.Privacidade(celular);
                    session.stage = "final_register";
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista"); 
                }
            break;
            case "final_register":
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === "sim"){
                        await this.MensagensComuns(celular, "🫱🏻‍🫲🏼 *Parabéns* estamos quase lá...\n🔍 Vamos realizar a *Consulta do seu CPF*. \nUm de nossos *atendentes* entrará em contato para finalizar a sua *contratação* enviando o *link* com os *Termos de Adesão e Contrato de Permanência* a serem *assinados*\nAtt.: *Wip Telecom*");
                        let dadosCliente = session.dadosCompleto ? JSON.stringify(session.dadosCompleto, null, 2) : "Dados não encontrados";
                        let msg = `*🧑 Instalação Nova* \nPlano Escolhido: ${session.planoEscolhido}\nVencimento: ${session.vencimentoEscolhido}\nDados do Cliente: ${dadosCliente}`;
                        await this.MensagensComuns(process.env.TEST_PHONE, msg);
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                    }
                    else if(texto.toLowerCase() === "não" || texto.toLowerCase() === "nao"){
                        await this.MensagensComuns(celular, "🥹 *Infelizmente* não poderei mais dar \ncontinuidade ao seu atendimento, *respeitando* a sua vontade.\n🫡Estaremos sempre aqui a sua *disposição*!");
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                    }
                    else{
                        await this.MensagensComuns(celular, "Opção invalida 😞\n🙏🏻Por gentileza, Selecione um Botão"); 
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione um Botão"); 
                }
            break;
            
            //Mudança de Cômodo
            case "mudanca_comodo":
                await this.iniciarMudancaComodo(celular, texto, session);
            break;
            case "choose_type_comodo":
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === "paga"){
                        await this.MensagemBotao(celular, "Escolha Forma de Pagamento", "Pix", "Cartão", "Dinheiro");
                        session.stage = "choose_type_payment";
                    }
                    else if(texto.toLowerCase() === "grátis" || texto.toLowerCase() === "gratis"){
                        await this.MensagensComuns(celular, "🫱🏻‍🫲🏼 *Parabéns* estamos quase lá...\nUm de nossos *atendentes* entrará em contato para finalizar a sua *mudança de cômodo* enviando o *link* com os *Termos de Adesão e Contrato de Permanência* a serem *assinados*\nAtt.: *Wip Telecom*");
                        let dadosCliente = session.dadosCompleto ? JSON.stringify(session.dadosCompleto, null, 2) : "Dados não encontrados";
                        let msg = `*🧱 Mudança de Cômodo* \n\n*🆓 Forma: Gratis*\nDados do Cliente: ${dadosCliente}`;
                        await this.MensagensComuns(process.env.TEST_PHONE, msg);
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                    }
                    else{
                        await this.MensagensComuns(celular, "Opção Invalída, Selecione a Opção da Lista");
                    }
                    }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista");
                }
            break;

            //Troca de Titularidade         
            case "troca_titularidade":
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === 'sim'){
                        await this.MensagemTermos(celular, 'Termos Troca de Titularidade', '📄 Para dar *continuidade*, é preciso que *leia* o *Termo* abaixo e escolha a opção que deseja.', "Ler Termos", "https://apimk.wiptelecomunicacoes.com.br/menu/TrocaTitularidade");
                        await this.MensagemBotao(celular, "Escolha a Opção", "Concordo", "Não Concordo");
                        session.stage = "handle_titularidade";
                    }
                    else if(texto.toLowerCase() === 'não' || texto.toLowerCase() === 'nao'){
                        await this.MensagensComuns(celular, "🤷🏽 *Infelizmente* não podemos dar continuidade ao seu *atendimento* por não ser o *Titular do Cadastro!!!*")
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                    }
                    else{
                        await this.MensagensComuns(celular, "Aperte nos Botoes de Sim ou Não");
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção dos Botoes");
                }
            break;
            case "handle_titularidade":
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === 'concordo'){
                        await this.iniciarMudancaTitularidade(celular, texto, session);
                        session.stage = "handle_titularidade_2";
                    }
                    else if(texto.toLowerCase() === 'não concordo' || texto.toLowerCase() === 'nao concordo'){
                        await this.MensagensComuns(celular, "🤷🏽 *Infelizmente* não podemos dar continuidade ao seu *atendimento* por não Aceitar os *Termos!!*")
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                    }
                    else{
                        await this.MensagensComuns(celular, "Aperte nos Botoes de Sim ou Não");
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção dos Botoes");
                }
            break;
            case "handle_titularidade_2":
                await this.iniciarMudancaTitularidade(celular, texto, session);
            break;
            case "choose_type_titularidade":
                if(this.verificaType(type)){   
                    await this.MensagensComuns(celular, "🫱🏻‍🫲🏼 *Parabéns* estamos quase lá...\nUm de nossos *atendentes* entrará em contato para finalizar a sua *Alteração de Titularidade* enviando o *link* para o cliente atual com o *Termo de Alteração de Titularidade* \n\ne ao Novo Cliente o *link* com os *Termos de Adesão, Alteração de Titularidade e Contrato de Permanência* a serem *assinados*.\nAtt.: *Wip Telecom*");
                    let dadosCliente = session.dadosCompleto ? JSON.stringify(session.dadosCompleto, null, 2) : "Dados não encontrados";
                    let msg = `*🎭 Troca de Titularidade*\n\nDados do Cliente: ${dadosCliente}`;
                    await this.MensagensComuns(process.env.TEST_PHONE, msg);
                    clearTimeout(sessions[celular].inactivityTimer);                       
                    delete sessions[celular];                   
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção dos Botoes");
                }
            break;

            //Troca de Plano
            case "troca_plano":
                await this.iniciarTrocaPlano(celular,texto,session);
            break;
            case "choose_type_troca_plano":
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === "sim corcordo"){
                        await this.MensagemBotao(celular, "Escolha qual seu *Tipo* de *Tecnologia*: \n(Caso tenha dúvida, pergunte para nossos atendentes)", "Fibra", "Rádio");
                        session.stage = "select_plan_troca";
                    }
                    else if(texto.toLowerCase() === "nao" || texto.toLowerCase() === "não"){
                        await this.MensagensComuns(celular, "🤷🏽 *Infelizmente* não podemos dar continuidade ao seu *atendimento* por não Aceitar os *Termos!!*")
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];   
                    }
                    else{
                        await this.MensagensComuns(celular, "Aperte nos Botoes de Sim ou Não");
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção dos Botoes");
                }
            break;
            case "select_plan_troca":
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === "fibra"){
                        await this.MensagemLista(celular, "Escolha seu Plano", {
                            sections: [
                                {
                                    title: 'Escolha seu Plano',
                                    rows: [
                                        { id: 'option_1', title: '🟣 400 MEGA R$ 89,90' },
                                        { id: 'option_2', title: '🟩 500 MEGA R$ 99,90' },
                                        { id: 'option_3', title: '🔴 600 MEGA R$ 109,90' },
                                        { id: 'option_4', title: '🟡 700 MEGA R$ 129,90' },
                                        { id: 'option_5', title: '🟦 800 MEGA R$ 159,90' },
                                    ]
                                }
                            ]
                        });

                        
                        
                        session.stage = "plan_troca_final";

                    }
                    else if(texto.toLowerCase() === "radio" || texto.toLowerCase() === "rádio"){
                        await this.MensagemLista(celular, "Escolha seu Plano", {
                            sections: [
                                {
                                    title: 'Escolha seu Plano',
                                    rows: [
                                        { id: 'option_1', title: '🟩 8 MEGA R$ 89,90' },
                                        { id: 'option_2', title: '🟦 15 MEGA R$ 119,90' },                                       
                                    ]
                                }
                            ]
                        });
                        session.stage = "plan_troca_final";
                    }
                    else{
                        await this.MensagensComuns(celular, "Aperte nos Botoes de Fibra ou Rádio");
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção dos Botoes");
                }
            break;
            case "plan_troca_final":
                if(this.verificaType(type)){
                    if(texto = "🟣 400 MEGA R$ 89,90"){
                        let planoEscolhido = "🟣 400 MEGA R$ 89,90";
                        session.planoEscolhido = planoEscolhido;
                        session.stage = "finish_troca_plan";
                        await this.MensagemBotao(celular, "Clique em *Concluir* para Terminar a alteração de plano", "Concluir");
                    }
                    else if(texto = "🟩 500 MEGA R$ 99,90"){
                        let planoEscolhido = "🟩 500 MEGA R$ 99,90";
                        session.planoEscolhido = planoEscolhido;
                        session.stage = "finish_troca_plan";
                        await this.MensagemBotao(celular, "Clique em *Concluir* para Terminar a alteração de plano", "Concluir");
                    }
                    else if(texto = "🔴 600 MEGA R$ 109,90"){
                        let planoEscolhido = "🔴 600 MEGA R$ 109,90";
                        session.planoEscolhido = planoEscolhido;
                        session.stage = "finish_troca_plan";
                        await this.MensagemBotao(celular, "Clique em *Concluir* para Terminar a alteração de plano", "Concluir");
                    }
                    else if(texto = "🟡 700 MEGA R$ 129,90"){
                        let planoEscolhido = "🟡 700 MEGA R$ 129,90";
                        session.planoEscolhido = planoEscolhido;
                        session.stage = "finish_troca_plan";
                        await this.MensagemBotao(celular, "Clique em *Concluir* para Terminar a alteração de plano", "Concluir");
                    }
                    else if(texto = "🟦 800 MEGA R$ 159,90"){
                        let planoEscolhido = "🟦 800 MEGA R$ 159,90";
                        session.planoEscolhido = planoEscolhido;
                        session.stage = "finish_troca_plan";
                        await this.MensagemBotao(celular, "Clique em *Concluir* para Terminar a alteração de plano", "Concluir");
                    }
                    else if(texto = "🟩 8 MEGA R$ 89,90"){
                        let planoEscolhido = "🟩 8 MEGA R$ 89,90";
                        session.planoEscolhido = planoEscolhido;
                        session.stage = "finish_troca_plan";
                        await this.MensagemBotao(celular, "Clique em *Concluir* para Terminar a alteração de plano", "Concluir");
                    }
                    else if(texto = "🟦 15 MEGA R$ 119,90"){
                        let planoEscolhido = "🟦 15 MEGA R$ 119,90";
                        session.planoEscolhido = planoEscolhido;
                        session.stage = "finish_troca_plan";
                        await this.MensagemBotao(celular, "Clique em *Concluir* para Terminar a alteração de plano", "Concluir");
                    }
                    else{
                        await this.MensagensComuns(celular, "Aperte nos Botoes da Lista");
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção dos Botoes");
                }
            break;
            case "finish_troca_plan":
                await this.MensagensComuns(celular, "🫱🏻‍🫲🏼 *Parabéns* estamos quase lá...\n🔍 Um de nossos *atendentes* entrará em contato para finalizar a sua *Alteração de plano* enviando o *link* com os *Termos de Alteração de Plano, Termo de Adesão e Contrato de Permanência * a serem *assinados*\nAtt.: *Wip Telecom*");
                        let dadosCliente = session.dadosCompleto ? JSON.stringify(session.dadosCompleto, null, 2) : "Dados não encontrados";
                        let msg = `*🔌 Alteração de Plano* \nPlano Escolhido: ${session.planoEscolhido}\nDados do Cliente: ${dadosCliente}`;
                        await this.MensagensComuns(process.env.TEST_PHONE, msg);
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                break;
            
            //Mudança de Endereço
            case "mudanca_endereco":
                if(this.verificaType(type)){
                    await this.iniciarMudanca(celular, texto, session);
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista");
                }
            break;
            case "choose_type_endereco":
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === "paga"){
                        await this.MensagemBotao(celular, "Escolha Forma de Pagamento", "Pix", "Cartão", "Dinheiro");
                        session.stage = "choose_type_payment";
                    }
                    else if(texto.toLowerCase() === "grátis" || texto.toLowerCase() === "gratis"){
                        await this.MensagensComuns(celular, "🫱🏻‍🫲🏼 *Parabéns* estamos quase lá...\nUm de nossos *atendentes* entrará em contato para finalizar a sua *mudança de endereço* enviando o *link* com os *Termos de Alteração de Endereço e Contrato de Permanência* a serem *assinados*\nAtt.: *Wip Telecom*");
                        let dadosCliente = session.dadosCompleto ? JSON.stringify(session.dadosCompleto, null, 2) : "Dados não encontrados";
                        let msg = `*🏠 Mudança de Endereço* \n\n*🆓 Forma: Gratis*\nDados do Cliente: ${dadosCliente}`;
                        await this.MensagensComuns(process.env.TEST_PHONE, msg);
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                    }
                    else{
                        await this.MensagensComuns(celular, "Opção Invalída, Selecione a Opção da Lista");
                    }
                    }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, Selecione uma Opção da Lista");
                }
            break;
            
            //Boleto e Pix
            case 'awaiting_cpf':
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === 'inicio' || texto.toLowerCase() === 'início'){
                        await this.boasVindas(celular);
                        await this.MensagemBotao(celular, "Escolha um Botão", "Boleto/Pix", "Serviços/Contratação", "Falar com Atendente");
                        session.stage = "options_start";
                    }
                    else if (this.validarCPF(texto)) {
                        const cpf = texto.replace(/[^\d]+/g, '');
                        console.log("Consultar cadastro");
                        session.cpf = cpf;
        
                        const sis_cliente = await Sis_Cliente.findAll({ attributes: ['id', 'nome', 'endereco', 'login', 'numero'], where: { cpf_cnpj: cpf, cli_ativado: 's' } });
        
                        if (sis_cliente.length > 1) {
                            let currentIndex = 1;
                            let structuredData = sis_cliente.map((client) => {
                                const data = {
                                    index: currentIndex, // Definindo o índice manualmente
                                    id: Number(client.dataValues.id),
                                    nome: client.dataValues.nome,
                                    endereco: client.dataValues.endereco,
                                    login: client.dataValues.login,
                                    numero: client.dataValues.numero,
                                    cpf: cpf
                                };
                                currentIndex++; // Incrementando o índice para o próximo cliente
                                return data;
                            });
        
                            session.structuredData = structuredData;
        
                            // Convertendo structuredData para uma string legível
                            await this.MensagensComuns(celular, "🔍 Cadastros encontrados! ");
                            let messageText = "🔍 Mais de um *Cadastro encontrado!* Digite o *Número* para qual deseja 👇🏻\n\n";
                            structuredData.forEach(client => {
                                messageText += `*${client.index}* Nome: ${client.nome}, Endereço: ${client.endereco} N: ${client.numero}\n\n`;
                            });
                            messageText += "👉🏻 Caso queira voltar ao Menu Inicial digite *início*";
                            session.stage = 'awaiting_selection';
        
                            await this.MensagensComuns(celular, messageText);
                        } else if (sis_cliente.length === 1) {
                            session.stage = 'end';
                            await this.MensagensComuns(celular, `🔍 Cadastro encontrado! ${sis_cliente[0].dataValues.login.toUpperCase()}`);
                            await this.enviarBoleto(sis_cliente[0].dataValues.login, celular, sis_cliente[0].dataValues.endereco, cpf);
                            await this.MensagensComuns(celular, "👉🏻 Digite *continuar* para terminar o atendimento");

                        } else {
                            await this.MensagensComuns(celular, "🙁 Seu cadastro *não* foi *encontrado*, verifique se digitou corretamente o seu *CPF/CNPJ*");
                            session.stage = 'awaiting_cpf';
                        }
                    } else {
                        console.log("CPF/CNPJ inválido. Por favor, verifique e tente novamente.");
                        session.stage = 'awaiting_cpf';
                    }
                    this.resetInactivityTimer.call(this, celular, session);
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, *Digite* seu *CPF/CNPJ*!!");
                }
                break;
            case 'awaiting_selection':
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === 'inicio' || texto.toLowerCase() === 'início'){
                        await this.boasVindas(celular);
                        await this.MensagemBotao(celular, "Escolha um Botão", "Boleto/Pix", "Serviços/Contratação", "Falar com Atendente");
                        session.stage = "options_start";
                    }
                    else{
                        const selectedIndex = parseInt(texto, 10) - 1;
                    const options = session.structuredData.length + 1;
                    if (!isNaN(selectedIndex)) {
                        if (selectedIndex < options) {
                            const selectedClient = session.structuredData[selectedIndex];
                            console.log(selectedClient);
                            console.log(`Usuário selecionou o cliente com ID: ${selectedClient.id}`);
                            await this.enviarBoleto(selectedClient.login, celular, selectedClient.endereco, selectedClient.cpf);
                        
                            await this.MensagensComuns(celular, "👇🏻👇🏻👇🏻👇🏻👇🏻👇🏻\n\n🙂Deseja voltar e retirar boleto referente a outro endereço?\n⬆️ Digite *voltar* ou *continuar*");
                            
                            session.stage = 'end';
                        } else {
                            console.log('⚠️ Seleção *inválida*, por favor, tente novamente.');
                            await this.MensagensComuns(celular, '⚠️ Seleção *inválida*, por favor, tente novamente.');
                            session.stage = 'awaiting_selection';
                        }
                    } else {
                        console.log('⚠️ Seleção *inválida*, por favor, tente novamente.');
                        await this.MensagensComuns(celular, '⚠️ Seleção *inválida*, por favor, tente novamente.');
                        session.stage = 'awaiting_selection';
                    }
                    this.resetInactivityTimer.call(this, celular, session);
                    }
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n\n🙏🏻Por gentileza, *selecione* uma opção válida!!");
                }
                break;
            case 'end':
                if(this.verificaType(type)){
                    if(texto.toLowerCase() === 'voltar' && session.structuredData){
                        session.stage = 'awaiting_selection';
                        let messageText = "🔍 Mais de um *Cadastro encontrado!* Digite o *Número* para qual deseja 👇🏻\n\n";
                        session.structuredData.forEach(client => {
                            messageText += `*${client.index}* Nome: ${client.nome}, Endereço: ${client.endereco} N: ${client.numero}\n\n`;
                        });
                        messageText += "👉🏻 Caso queira voltar ao Menu Inicial digite *início*";
                        await this.MensagensComuns(celular, messageText);
                    }
                    else{
                        if (!session.endHandled) {
                            let messageText2 = "Ainda Precisa de Ajuda? 🤓\n\n";
                            messageText2 += '*1* Sim \n\n';
                            messageText2 += '*2* Não \n\n';
                            await this.MensagensComuns(celular, messageText2);
                            session.endHandled = true; // Marcar como processado
                            session.stage = 'end_talk';
                        }
                        this.resetInactivityTimer.call(this, celular, session); 
                    }  
                }
                else{
                    await this.MensagensComuns(celular, "*Desculpe* eu sou um Robô e não entendo áudios ou imagens 😞\n🙏🏻Por gentileza, *selecione* uma opção válida!!");
                }
                break;
            case 'end_talk':
                    if (texto == '1' || texto.toLowerCase() === 'sim') {
                        await this.boasVindas(celular);
                        
                        await this.MensagemBotao(celular, "Escolha um Botão", "Boleto/Pix", "Serviços/Contratação", "Falar com Atendente");
                        
                        session.stage = 'options_start';
                        session.endHandled = false; // Resetar para o próximo ciclo
                    } else if (texto == '2' || texto.toLowerCase() === 'não' || texto.toLowerCase() === 'nao') {
                        await this.MensagensComuns(celular,"*Wip Telecom*\n*Obrigado*, fiquei muito feliz de ter você por aqui! \nConte Sempre Comigo 😉");  
                        clearTimeout(sessions[celular].inactivityTimer);                       
                        delete sessions[celular];
                        console.log("Clientes Utilizando o Bot no momento: " + this.getActiveSessionsCount());  
                    }
                    else{
                        await this.MensagensComuns(celular,"⚠️ Seleção *Inválida*, Verifique se Digitou o Número Corretamente!!!");
                    }
                break;
       }
    }
    

    console.log(`Nova sessão para ${celular}:`, session);
    }
        

    async iniciarCadastro(celular, texto, session) {
        const perguntas = [
            { campo: 'nome', pergunta: '➡️ Digite seu *nome completo*:' },
            { campo: 'rg', pergunta: '➡️ Digite seu *RG*:' },
            { campo: 'cpf', pergunta: '➡️ Digite seu *CPF/CNPJ*:' },
            { campo: 'dataNascimento', pergunta: '➡️ Digite sua *data de nascimento*:' },
            { campo: 'celular', pergunta: '➡️ Digite seu número de *celular* com *DDD*:' },
            { campo: 'celularSecundario', pergunta: '➡️ Digite um segundo *celular*  para *contato* com *DDD*:' },
            { campo: 'email', pergunta: '➡️ Digite seu *e-mail*:' },
            { campo: 'rua', pergunta: '➡️ Digite sua *Rua*:' },
            { campo: 'numero', pergunta: '➡️ Digite o *Número* de sua *Residência*:' },
            { campo: 'bairro', pergunta: '➡️ Digite seu *Bairro*:' },
            { campo: 'cidade', pergunta: '➡️ Digite sua *Cidade*:' },
            { campo: 'estado', pergunta: '➡️ Digite seu *Estado*:' },
            { campo: 'cep', pergunta: '➡️ Digite seu *CEP*:' }
        ];
    
        // Se a sessão ainda não foi iniciada ou estamos começando, inicia o cadastro
        if (!session.dadosCadastro || session.ultimaPergunta === null) {
            console.log("Iniciando cadastro...");
            await this.MensagensComuns(celular, "🔤 Pronto, agora vamos coletar todos os seus *Dados* para elaborar o Cadastro e realizar os *Termos de Adesão*.");
            session.dadosCadastro = {}; // Inicializa os dados do cadastro
            session.ultimaPergunta = perguntas[0].campo; // Começa com a primeira pergunta
            await this.MensagensComuns(celular, perguntas[0].pergunta); // Envia a primeira pergunta
            return;
        }
    
        // Se existe uma última pergunta, armazena a resposta
        const ultimaPergunta = session.ultimaPergunta;
        if (ultimaPergunta) {
            // Valida o CPF antes de prosseguir
            if (ultimaPergunta === 'cpf') {
                const cpfValido = await this.validarCPF(texto);
                if (!cpfValido) {
                    await this.MensagensComuns(celular, "❌ *CPF* inválido. Por favor, insira um *CPF* válido.");
                    return; // Não avança para a próxima pergunta
                }
            }

            if (ultimaPergunta === 'rg') {
                const RgValido = await this.validarRG(texto);
                if (!RgValido) {
                    await this.MensagensComuns(celular, "❌ *RG* inválido. Por favor, insira um *RG* válido.");
                    return; // Não avança para a próxima pergunta
                }
            }
    
            session.dadosCadastro[ultimaPergunta] = texto; // Armazena a resposta
            console.log(`Resposta para ${ultimaPergunta}:`, texto);
            console.log("Dados atualizados:", session.dadosCadastro);
        }
    
        // Encontra a próxima pergunta
        const proximaPerguntaIndex = perguntas.findIndex(q => q.campo === ultimaPergunta) + 1;
    
        if (proximaPerguntaIndex < perguntas.length) {
            const proximaPergunta = perguntas[proximaPerguntaIndex].pergunta;
            session.ultimaPergunta = perguntas[proximaPerguntaIndex].campo; // Atualiza para a próxima pergunta
            console.log("Próxima pergunta:", proximaPergunta);
            await this.MensagensComuns(celular, proximaPergunta); // Envia a próxima pergunta
        } else {
            // Cadastro completo
            await this.MensagensComuns(celular, "🛜 Vamos escolher o seu *Plano de Internet*");
            await this.MensagemLista(celular, "Escolha seu Plano", {
                sections: [
                    {
                        title: 'Escolha seu Plano',
                        rows: [
                            { id: 'option_1', title: '🟣 400 MEGA R$ 89,90' },
                            { id: 'option_2', title: '🟩 500 MEGA R$ 99,90' },
                            { id: 'option_3', title: '🔴 600 MEGA R$ 109,90' },
                            { id: 'option_4', title: '🟡 700 MEGA R$ 129,90' },
                            { id: 'option_5', title: '🟦 800 MEGA R$ 159,90' },
                            { id: 'option_6', title: '⬛ Rural (Consultar)' },
                        ]
                    }
                ]
            });
            session.stage = "plan";
            console.log("Dados cadastrados:", session.dadosCadastro);
    
            // Aqui você armazena todos os dados na sessão
            session.dadosCompleto = {
                ...session.dadosCadastro, // Inclui todos os dados do cadastro
            };
    
            // Finaliza o cadastro
            session.dadosCadastro = null;
            session.ultimaPergunta = null;
        }
    }

    async iniciarMudanca(celular, texto, session) {
        const perguntas = [
            { campo: 'nome', pergunta: '➡️ Digite seu *nome completo*:' },
            { campo: 'cpf', pergunta: '➡️ Digite seu *CPF*:' },
            { campo: 'celular', pergunta: '➡️ Digite seu *Celular* com *DDD*:' },
            { campo: 'novo_endereco', pergunta: '➡️ Digite seu *Novo Endereço*: (Rua e Numero)' },
            { campo: 'novo_bairro', pergunta: '➡️ Digite seu *Novo Bairro*:' },
            { campo: 'cep', pergunta: '➡️ Digite seu *CEP*:' },
        ];
    
        // Se a sessão ainda não foi iniciada ou estamos começando, inicia o cadastro
        if (!session.dadosCadastro || session.ultimaPergunta === null) {
            console.log("Iniciando mudança...");
            await this.MensagensComuns(celular, "🔤 Pronto, agora vamos coletar todos os *Dados* para realizar a mudança de endereço");
            session.dadosCadastro = {}; // Inicializa os dados do cadastro
            session.ultimaPergunta = perguntas[0].campo; // Começa com a primeira pergunta
            await this.MensagensComuns(celular, perguntas[0].pergunta); // Envia a primeira pergunta
            return;
        }
    
        // Se existe uma última pergunta, armazena a resposta
        const ultimaPergunta = session.ultimaPergunta;
        if (ultimaPergunta) {
            // Valida o CPF antes de prosseguir
            if (ultimaPergunta === 'cpf') {
                const cpfValido = await this.validarCPF(texto);
                if (!cpfValido) {
                    await this.MensagensComuns(celular, "❌ *CPF* inválido. Por favor, insira um *CPF* válido.");
                    return; // Não avança para a próxima pergunta
                }
            }
    
            session.dadosCadastro[ultimaPergunta] = texto; // Armazena a resposta
            console.log(`Resposta para ${ultimaPergunta}:`, texto);
            console.log("Dados atualizados:", session.dadosCadastro);
        }
    
        // Encontra a próxima pergunta
        const proximaPerguntaIndex = perguntas.findIndex(q => q.campo === ultimaPergunta) + 1;
    
        if (proximaPerguntaIndex < perguntas.length) {
            const proximaPergunta = perguntas[proximaPerguntaIndex].pergunta;
            session.ultimaPergunta = perguntas[proximaPerguntaIndex].campo; // Atualiza para a próxima pergunta
            console.log("Próxima pergunta:", proximaPergunta);
            await this.MensagensComuns(celular, proximaPergunta); // Envia a próxima pergunta
        } else {

            
            console.log("Dados atualizados:", session.dadosCadastro);

            await this.MensagemTermos(celular, 'Termos Mudança de Endereço', '📄 Para dar *continuidade*, é preciso que *leia* o *Termo* abaixo e escolha a forma que deseja', "Ler Termos", "https://apimk.wiptelecomunicacoes.com.br/menu/MudancaEndereco");
            await this.MensagemBotao(celular, "Escolha a Forma", "Grátis", "Paga");
            session.stage = "choose_type_endereco";

            // Aqui você armazena todos os dados na sessão
            session.dadosCompleto = {
                ...session.dadosCadastro, // Inclui todos os dados do cadastro
            };
    
            // Finaliza o cadastro
            session.dadosCadastro = null;
            session.ultimaPergunta = null;
        }
    }

    async iniciarMudancaComodo(celular, texto, session) {
        const perguntas = [
            { campo: 'nome', pergunta: '➡️ Digite seu *nome completo*:' },
            { campo: 'cpf', pergunta: '➡️ Digite seu *CPF*:' },
            { campo: 'celular', pergunta: '➡️ Digite seu *Celular* com *DDD*:' },
        ];
    
        // Se a sessão ainda não foi iniciada ou estamos começando, inicia o cadastro
        if (!session.dadosCadastro || session.ultimaPergunta === null) {
            console.log("Iniciando mudança...");
            await this.MensagensComuns(celular, "🔤 Agora vamos coletar todos os *Dados* para realizar a mudança de cômodo e agendar a visita");
            session.dadosCadastro = {}; // Inicializa os dados do cadastro
            session.ultimaPergunta = perguntas[0].campo; // Começa com a primeira pergunta
            await this.MensagensComuns(celular, perguntas[0].pergunta); // Envia a primeira pergunta
            return;
        }
    
        // Se existe uma última pergunta, armazena a resposta
        const ultimaPergunta = session.ultimaPergunta;
        if (ultimaPergunta) {
            // Valida o CPF antes de prosseguir
            if (ultimaPergunta === 'cpf') {
                const cpfValido = await this.validarCPF(texto);
                if (!cpfValido) {
                    await this.MensagensComuns(celular, "❌ *CPF* inválido. Por favor, insira um *CPF* válido.");
                    return; // Não avança para a próxima pergunta
                }
            }
    
            session.dadosCadastro[ultimaPergunta] = texto; // Armazena a resposta
            console.log(`Resposta para ${ultimaPergunta}:`, texto);
            console.log("Dados atualizados:", session.dadosCadastro);
        }
    
        // Encontra a próxima pergunta
        const proximaPerguntaIndex = perguntas.findIndex(q => q.campo === ultimaPergunta) + 1;
    
        if (proximaPerguntaIndex < perguntas.length) {
            const proximaPergunta = perguntas[proximaPerguntaIndex].pergunta;
            session.ultimaPergunta = perguntas[proximaPerguntaIndex].campo; // Atualiza para a próxima pergunta
            console.log("Próxima pergunta:", proximaPergunta);
            await this.MensagensComuns(celular, proximaPergunta); // Envia a próxima pergunta
        } else {

            
            console.log("Dados atualizados:", session.dadosCadastro);

            await this.MensagemTermos(celular, 'Termos Mudança de Cômodo', '📄 Para dar *continuidade*, é preciso que *leia* o *Termo* abaixo e escolha a forma que deseja', "Ler Termos", "https://apimk.wiptelecomunicacoes.com.br/menu/MudancaComodo");
            await this.MensagemBotao(celular, "Escolha a Forma", "Grátis", "Paga");
            session.stage = "choose_type_comodo";

            // Aqui você armazena todos os dados na sessão
            session.dadosCompleto = {
                ...session.dadosCadastro, // Inclui todos os dados do cadastro
            };
    
            // Finaliza o cadastro
            session.dadosCadastro = null;
            session.ultimaPergunta = null;
        }
    }

    async iniciarMudancaTitularidade(celular, texto, session) {
        const perguntas = [
            { campo: 'nome', pergunta: '➡️ Digite seu *nome completo*:' },
            { campo: 'cpf', pergunta: '➡️ Digite seu *CPF*:' },
            { campo: 'celular', pergunta: '➡️ Digite seu *Celular* com *DDD*:' },
            { campo: 'nome_novo_titular', pergunta: '➡️ Digite o *Nome Completo* do *Novo Titular*:' },
            { campo: 'celular_novo_titular', pergunta: '➡️ Digite o *Celular do Novo Titular* com *DDD*:' }
        ];
    
        // Se a sessão ainda não foi iniciada ou estamos começando, inicia o cadastro
        if (!session.dadosCadastro || session.ultimaPergunta === null) {
            console.log("Iniciando mudança...");
            await this.MensagensComuns(celular, "🔤 Agora vamos coletar todos os *Dados* para realizar a troca de titularidade");
            session.dadosCadastro = {}; // Inicializa os dados do cadastro
            session.ultimaPergunta = perguntas[0].campo; // Começa com a primeira pergunta
            await this.MensagensComuns(celular, perguntas[0].pergunta); // Envia a primeira pergunta
            return;
        }
    
        // Se existe uma última pergunta, armazena a resposta
        const ultimaPergunta = session.ultimaPergunta;
        if (ultimaPergunta) {
            // Valida o CPF antes de prosseguir
            if (ultimaPergunta === 'cpf') {
                const cpfValido = await this.validarCPF(texto);
                if (!cpfValido) {
                    await this.MensagensComuns(celular, "❌ *CPF* inválido. Por favor, insira um *CPF* válido.");
                    return; // Não avança para a próxima pergunta
                }
            }
    
            session.dadosCadastro[ultimaPergunta] = texto; // Armazena a resposta
            console.log(`Resposta para ${ultimaPergunta}:`, texto);
            console.log("Dados atualizados:", session.dadosCadastro);
        }
    
        // Encontra a próxima pergunta
        const proximaPerguntaIndex = perguntas.findIndex(q => q.campo === ultimaPergunta) + 1;
    
        if (proximaPerguntaIndex < perguntas.length) {
            const proximaPergunta = perguntas[proximaPerguntaIndex].pergunta;
            session.ultimaPergunta = perguntas[proximaPerguntaIndex].campo; // Atualiza para a próxima pergunta
            console.log("Próxima pergunta:", proximaPergunta);
            await this.MensagensComuns(celular, proximaPergunta); // Envia a próxima pergunta
        } else {

            
            console.log("Dados atualizados:", session.dadosCadastro);

            session.stage = "choose_type_titularidade";

            await this.MensagemBotao(celular, "Aperte Em *Continuar* para Concluir a Troca de *Titularidade*", "Continuar");

            // Aqui você armazena todos os dados na sessão
            session.dadosCompleto = {
                ...session.dadosCadastro, // Inclui todos os dados do cadastro
            };

            // Finaliza o cadastro
            session.dadosCadastro = null;
            session.ultimaPergunta = null;
        }
    }

    async iniciarTrocaPlano(celular, texto, session) {
        const perguntas = [
            { campo: 'nome', pergunta: '➡️ Digite seu *nome completo*:' },
            { campo: 'cpf', pergunta: '➡️ Digite seu *CPF*:' },
            { campo: 'celular', pergunta: '➡️ Digite seu *Celular* com *DDD*:' }
        ];
    
        // Se a sessão ainda não foi iniciada ou estamos começando, inicia o cadastro
        if (!session.dadosCadastro || session.ultimaPergunta === null) {
            console.log("Iniciando mudança...");
            await this.MensagensComuns(celular, "🔤 Pronto, agora vamos coletar todos os *Dados* para realizar a Alteração de Plano");
            session.dadosCadastro = {}; // Inicializa os dados do cadastro
            session.ultimaPergunta = perguntas[0].campo; // Começa com a primeira pergunta
            await this.MensagensComuns(celular, perguntas[0].pergunta); // Envia a primeira pergunta
            return;
        }
    
        // Se existe uma última pergunta, armazena a resposta
        const ultimaPergunta = session.ultimaPergunta;
        if (ultimaPergunta) {
            // Valida o CPF antes de prosseguir
            if (ultimaPergunta === 'cpf') {
                const cpfValido = await this.validarCPF(texto);
                if (!cpfValido) {
                    await this.MensagensComuns(celular, "❌ *CPF* inválido. Por favor, insira um *CPF* válido.");
                    return; // Não avança para a próxima pergunta
                }
            }
    
            session.dadosCadastro[ultimaPergunta] = texto; // Armazena a resposta
            console.log(`Resposta para ${ultimaPergunta}:`, texto);
            console.log("Dados atualizados:", session.dadosCadastro);
        }
    
        // Encontra a próxima pergunta
        const proximaPerguntaIndex = perguntas.findIndex(q => q.campo === ultimaPergunta) + 1;
    
        if (proximaPerguntaIndex < perguntas.length) {
            const proximaPergunta = perguntas[proximaPerguntaIndex].pergunta;
            session.ultimaPergunta = perguntas[proximaPerguntaIndex].campo; // Atualiza para a próxima pergunta
            console.log("Próxima pergunta:", proximaPergunta);
            await this.MensagensComuns(celular, proximaPergunta); // Envia a próxima pergunta
        } else {

            
            console.log("Dados atualizados:", session.dadosCadastro);

            await this.MensagemTermos(celular, 'Termos Alteração de Plano', '📄 Para dar *continuidade*, é preciso que *leia* o *Termo* abaixo e escolha a opção que deseja', "Ler Termos", "https://apimk.wiptelecomunicacoes.com.br/menu/AlteracaoPlano");
            await this.MensagemBotao(celular, "Escolha a Opção", "Sim Corcordo", "Não");
            session.stage = "choose_type_troca_plano";

            // Aqui você armazena todos os dados na sessão
            session.dadosCompleto = {
                ...session.dadosCadastro, // Inclui todos os dados do cadastro
            };
    
            // Finaliza o cadastro
            session.dadosCadastro = null;
            session.ultimaPergunta = null;
        }
    }
    
    async LGPD(celular){
        await this.MensagemTermos(celular, "Termos LGPD",
            "📄 Para dar *continuidade*, é preciso que leia e *aceite* os *Termos abaixo* para a segurança dos seus dados pessoais, de acordo com a *LGPD*.",
            "Ler Termos", 
            "https://apimk.wiptelecomunicacoes.com.br/menu/PoliticaPrivacidade");     
            await this.MensagemBotao(celular, "Concorda com os Termos?", "Sim Aceito", "Não");
    }

    async Privacidade(celular){
        await this.MensagemTermos(celular,"🙂 Estamos quase terminando!", "🗂️ Peço que *leia atenciosamente* as *informações* abaixo, elas são importantes\ne queremos que não tenha nenhuma dúvida na sua *contratação*!","Ler o contrato","https://apimk.wiptelecomunicacoes.com.br/menu/TermosContratacao");
        await this.MensagemBotao(celular, "🆗 Li e estou de acordo com todas as informações acima que me foram dadas.", "Sim", "Não");
    }
    
    async formatarData(data) {
        const date = new Date(data);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Janeiro é 0!
        const day = date.getDate().toString().padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    async enviarBoleto(pppoe, celular, end, cpf){
        const cliente = await Record.findOne({where: {login: pppoe, status:{[Op.or]: ['vencido', 'aberto']}, datadel: null}, order: [['datavenc', 'ASC']],});

        const sis_cliente = await Sis_Cliente.findOne({where: {login: pppoe, cpf_cnpj: cpf, cli_ativado: 's'}});

        const desconto = sis_cliente.dataValues.desconto;

        let valor = Number(cliente.dataValues.valor);
        const dataVenc = cliente.dataValues.datavenc;
        let id = cliente.dataValues.id;

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

        valor -= desconto;

        const dataHoje = new Date();

        function resetTime(date) {
            date.setHours(0, 0, 0, 0);
            return date;
        }
        
        let dataVencSemHora = resetTime(new Date(dataVenc));
        let dataHojeSemHora = resetTime(new Date(dataHoje));

        if (dataVencSemHora > dataHojeSemHora) {
            console.log("Não está em atraso");
        } else if (dataVencSemHora < dataHojeSemHora) {
            console.log("está em atraso");


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
                tipo: "BOLETO/PIX BOT SOLICITADO",
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

        console.log(valor);

        if (typeof valor !== "string") {
            valor = valor.toFixed(2);
        } else {
            // Se valor for uma string, converta-o para número antes de chamar toFixed
            valor = Number(valor).toFixed(2);
        }
        
        

        const efipay = new EfiPay(options);

        console.log(id);

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

            const options2 = { month: '2-digit', day: '2-digit', year: 'numeric' };
            const formattedDate = new Intl.DateTimeFormat('pt-BR', options2).format(dataVenc);


        await this.enviarMensagemVencimento(celular, formattedDate, cliente.dataValues.linhadig, link, end, valor, pppoe, sis_cliente.dataValues.numero, cliente.dataValues.uuid_lanc);
    }

    async MensagensComuns(recipient_number, msg){
        try {
            const response = await axios.post(
              url,
              {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: recipient_number,
                type: 'text',
                text: {
                  preview_url: false,
                  body: String(msg),
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            console.log('Message sent successfully:', response.data);
          } catch (error) {
            console.error('Error sending message:', error);
          }
    }

    async PodeMePassarOCpf(recipient_number){
        try {
            let msg = "Sim, De acordo com a *Lei Geral de Proteção de Dados* 🔒 é preciso do seu consentimento para troca de dados, pode me fornecer seu *CPF/CNPJ*? 🖋️\n\n";
            msg += "Caso queira voltar ao Menu Inicial digite *início*";

            const response = await axios.post(
              url,
              {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: recipient_number,
                type: 'text',
                text: {
                  preview_url: false,
                  body: String(msg),
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            console.log('Message sent successfully:', response.data);
          } catch (error) {
            console.error('Error sending message:', error);
          }
    }

    async validarCPF(cpf){
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
        let soma = 0, resto;
        for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i-1, i)) * (11 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
        soma = 0;
        for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i-1, i)) * (12 - i);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
        return true;
    };

    async validarRG(rg) {
        // Remove tudo que não for número
        rg = rg.replace(/[^\d]+/g, '');
    
        // Valida o comprimento do RG (geralmente varia entre 7 e 10 dígitos)
        if (rg.length < 7 || rg.length > 10) return false;
    
        // Verifica se todos os dígitos são iguais (não permitido)
        if (/^(\d)\1+$/.test(rg)) return false;
    
        // RG parece válido (não existe fórmula como no CPF)
        return true;
    }
    

    verificaType(type) {
        if(type == "text" || type == "interactive"){
            return true;
        }
        else{
            return false;
        }
    }

    async enviarMensagemVencimento(receivenumber, dia, linha_dig, pix, end, valor, pppoe, numero, boletoID){
        try{
            await this.MensagensComuns(receivenumber, "🔎 *Só um Momento* 🕵️");
            // await wa.messages.template(test, receivenumber);
            let msg = `Aqui está a sua Mensalidade do dia *${dia}*\n\n`;
            msg += `*Endereço*: ${end}  Nº: ${numero}\n`;
            msg += `*Valor*: ${valor}\n`;

            await this.MensagensComuns(receivenumber, "*Pix* Acesse o Site 👇");
            await this.MensagensComuns(receivenumber, pix);

            await this.MensagensComuns(receivenumber, msg);
            if(linha_dig !== null){
                await this.downloadPdfFromSftp(receivenumber, process.env.SFTP_HOST,process.env.SFTP_USER,process.env.SFTP_PASSWORD,`${process.env.PDF_PATH}${boletoID}.pdf`, path.join(__dirname, '..', '..', 'temp', `${boletoID}.pdf`));
                await this.MensagensComuns(receivenumber, "Linha Digitavel 👇");
                await this.MensagensComuns(receivenumber, linha_dig);
            }    
        }
        catch( e )
        {
            console.error( JSON.stringify( e ) );
        }
    }

    async boasVindas(receivenumber){
        try {
            const response = await axios.post(
              url,
              {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: receivenumber,
                type: 'template',
                template: {
                  name: "bem_vindo",
                  language: {
                    code: "pt_BR"
                  },components: [
                    {
                      type: 'body'
                    },
                  ]
                }
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            console.log('Template message sent successfully:', response.data);
          } catch (error) {
            console.error('Error sending template message:', error);
          }
    }

    async downloadPdfFromSftp(receivenumber, host, username, password, remoteFilePath, localFilePath) {        
        const client = new SftpClient();
        try {
            await client.connect({
                host,
                port: 22,
                username,
                password
            });
            console.log(remoteFilePath);
            const fileExists = await client.exists(remoteFilePath);
            console.log("FILEEXISTS: " + fileExists);
            
            if (fileExists) {
                console.log(`Arquivo encontrado no servidor: ${remoteFilePath}`);
                await client.fastGet(remoteFilePath, localFilePath);
                await this.getMediaID(receivenumber, localFilePath, "whatsapp");
                console.log("PDF baixado com sucesso via SFTP");
            } else {
                console.error(`Arquivo não encontrado no servidor: ${remoteFilePath}`);
            }
        } catch (error) {
            console.error("Erro ao baixar o PDF via SFTP: ", error);
        } finally {
            client.end();
        }
    }

    async MensagemTermos(receivenumber, header, body, right_text_url, url_site){
        try {
            const response = await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: receivenumber, // O número de telefone do destinatário
                    type: 'interactive',
                    interactive: {
                        type: 'cta_url',
                        header:{
                            type: "text",
                            text: header
                        },
                        body: {
                            text: body,
                        },
                        action: {
                            name: "cta_url",
                            parameters: {
                                display_text: right_text_url,
                                url: url_site
                            }
                        }
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Substitua pelo seu token de acesso
                        'Content-Type': 'application/json',
                    }
                }
            )
            console.log(response.data); // Log da resposta da API
        } catch (error) {
            console.error('Erro ao enviar mensagem com botão de link:', error.response?.data || error.message);
        }
    }

    async MensagemLista(receivenumber, titulo, campos){
    try {
        const response = await axios.post(
            url, // Substitua pelo ID correto do telefone
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: receivenumber,
                type: 'interactive',
                interactive: {
                    type: 'list',
                    body: {
                        text: titulo,
                    },
                    action: {
                        button: 'Ver opções',
                        sections: campos.sections.map(section => (
                            {
                                title: section.title, // Título da seção
                                rows: section.rows.map(row => ({
                                id: row.id, // ID da linha
                                title: row.title, // Título da linha
                            }))
                            }
                        ))
                    }
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`, // Substitua pelo seu token de acesso
                    'Content-Type': 'application/json',
                }
            }
        );
        console.log(response.data); // Log da resposta da API
    } catch (error) {
        console.error('Erro ao enviar mensagem de lista:', error.response?.data || error.message);
    }
    }

    async MensagemBotao(receivenumber, texto, title1, title2 = 0, title3 = 0) {
        try {
            if(title3 != 0 && title2 != 0){
                const response = await axios.post(
                    url,
                    {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: receivenumber,
                        type: 'interactive',
                        interactive: {
                            type: 'button',
                            body: {
                                text: texto,
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: '1',
                                            title: title1,
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: '2',
                                            title: title2,
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: '3',
                                            title: title3,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log(response.data);
            }
            else if(title3 != 0){
                const response = await axios.post(
                    url,
                    {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: receivenumber,
                        type: 'interactive',
                        interactive: {
                            type: 'button',
                            body: {
                                text: texto,
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: '1',
                                            title: title1,
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: '2',
                                            title: title2,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log(response.data);
            }
            else if(title3 == 0 && title2 == 0){
                const response = await axios.post(
                    url,
                    {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: receivenumber,
                        type: 'interactive',
                        interactive: {
                            type: 'button',
                            body: {
                                text: texto,
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: '1',
                                            title: title1,
                                        },
                                    }
                                ],
                            },
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log(response.data);
            }
            else{
                const response = await axios.post(
                    url,
                    {
                        messaging_product: 'whatsapp',
                        recipient_type: 'individual',
                        to: receivenumber,
                        type: 'interactive',
                        interactive: {
                            type: 'button',
                            body: {
                                text: texto,
                            },
                            action: {
                                buttons: [
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: '1',
                                            title: title1,
                                        },
                                    },
                                    {
                                        type: 'reply',
                                        reply: {
                                            id: '2',
                                            title: title2,
                                        },
                                    },
                                ],
                            },
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log(response.data);
            }
            
        } catch (error) {
            console.error('Error sending button message:', error.response?.data || error.message);
        }
    }
    
    async getMediaID(receivenumber, filePath, type, messaging_product = "whatsapp") {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath)); 
        formData.append('type', type); 
        formData.append('messaging_product', messaging_product); 
    
        try {
            const response = await axios.post(
                urlMedia, 
                formData,  
                {
                    headers: {
                        Authorization: `Bearer ${token}`,  
                        ...formData.getHeaders()  
                    }
                }
            );
    
            console.log('Mídia enviada com sucesso:', response.data);
            const mediaId = response.data.id;  
            console.log("MEDIA ID: " + mediaId);
            this.MensagensDeMidia(receivenumber, "document", mediaId, "Boleto"); 
        } catch (error) {
            console.error('Erro ao enviar a mídia:', error.response?.data || error.message);
        }
    }

    
    async MensagensDeMidia(receivenumber, type, mediaID, filename) {
        try {
            const response = await axios.post(
                url,
                {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: receivenumber,
                    type: type,
                    document: {  // Substituímos "image" por "document"
                        id: mediaID,
                        filename: filename  // O nome do arquivo enviado
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
    
            console.log('Message sent successfully:', response.data);
        } catch (error) {
            console.error('Error sending media message:', error.response?.data || error.message);
        }
    }
    

}
export default new WhatsPixController();