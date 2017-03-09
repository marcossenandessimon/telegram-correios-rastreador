var TelegramBot = require('node-telegram-bot-api');
var http = require('http');
var cheerio = require('cheerio')
var pattern = /([0-9][0-9]\/[0-9][0-9]\/[0-9][0-9][0-9][0-9] [0-9][0-9]:[0-9][0-9])/
var token = process.env.TOKEN;
var q = require('q');

var bot = new TelegramBot(token, {polling: true});

bot.onText(/^(?!\/help$)(?!\/start).*/, function (msg) {
    var trackingCode = msg.text;
    buscar(trackingCode).then(function (res) {
        if(res.contador !== 0){
            bot.sendMessage(msg.chat.id, "Suas informações sobre a encomenda " + trackingCode + ": \n" + res.resposta);
        }else{
            bot.sendMessage(msg.chat.id, "Perdão, mas não foi encontrada nenhuma encomenda com o código: " + trackingCode);
        }
    })
})

bot.onText(/\/help/, function (msg) {
    bot.sendMessage(msg.chat.id, "Apenas me diga o código de rastreio que procurarei sua encomenda!")
})

function buscar(trackingCode) {
    var deferred = q.defer();
    var body;
    http.get("http://websro.correios.com.br/sro_bin/txect01$.Inexistente?P_LINGUA=001&P_TIPO=002&P_COD_LIS=" + trackingCode, function(res){
        res.on('data', function (data) {
            body += data;
        })
        res.on('end', function() {
            var dados = cheerio.load(body)        
            var dias;
            var contador = 0;
            var resposta = "";            
            dados('td').each(function (x) {
                if(x > 2){
                    if(pattern.exec(dados(this).text())){
                        if(contador !== 0){
                            resposta = resposta + "\n"
                            console.log(' ')
                        }
                        dias = x;
                        resposta = resposta + "-------------- \n";
                        resposta = resposta + "DATA: \n";
                        console.log('DATA: ');
                        contador++;
                        resposta = resposta + dados(this).text() + "\n"
                        console.log(dados(this).text());
                    }else if(x === dias + 1 ){
                        resposta = resposta + "-------------- \n";
                        resposta = resposta + "LOCAL: \n";
                        console.log('LOCAL: ')
                        resposta = resposta + dados(this).text() + "\n"
                        console.log(dados(this).text())
                        resposta = resposta + "-------------- \n";
                        resposta = resposta + "SITUAÇÃO: \n";
                        console.log('SITUAÇÃO: ')
                    }else{
                        resposta = resposta + dados(this).text() + "\n"
                        console.log(dados(this).text())
                    }
                }            
            })
            deferred.resolve({resposta: resposta, contador: contador});                        
        })
    })
    return deferred.promise;
}