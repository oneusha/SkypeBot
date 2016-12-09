const restify = require('restify');
const builder = require('botbuilder');
const WebSocket = require('ws');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
const bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

let co2 = 0;

const socket = new WebSocket('ws://kokorin-vrn.reksoft.ru:1080/websocket', {
  protocolVersion: 13,
  origin: 'http://localhost'
});

socket.on('open', () => {
  socket.send(JSON.stringify({
    'action': "$subscribe",
    'params': JSON.stringify({'topicId': 'weather'})
  }));
});

socket.on('message', function(e) {
  try {
    const data = JSON.parse(e);
    co2 = data.data && data.data.co2;
    console.log(co2);
  } catch(e) {}
});

socket.on('close', function close() {
  console.log('disconnected');
});

socket.on('error', (e) => {
  console.log(e);
  socket.send('something');
});

//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', session => {
    builder.Prompts.text(session, co2 > 800 ? 'Уровень co2 превышает норму. На данный момент составляет ' + co2 + 'ppm. Необходимо срочно осуществить провертивание офиса' : 'Уровень co2 в норме ' + co2 + 'ppm');
});
