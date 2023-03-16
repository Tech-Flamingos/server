'use strict';

require('dotenv').config();
const { Server } = require('socket.io');
const base64 = require('base-64');
var axios = require('axios');

const server = new Server();
const games = server.of('/games');

const PORT = process.env.PORT || 3002;
const apiServerUrl = process.env.API_SERVER;
const openAIKey = process.env.OPEN_AI_KEY;

let messages = [];
const client = axios.create({
  headers: {
    Authorization: 'Bearer ' + openAIKey,
  },
});

games.on('connection', socket => {
  console.log('socket connected to the game namespace', socket.id);

  socket.on('SIGN-UP', async payload => {
    let options = {
      method: 'POST',
      url: `${apiServerUrl}signup`,
      data: { name: payload.name, password: payload.password, role: payload.role },
    };
    axios.request(options).then(function (response) {
      socket.emit('LOGGED-IN', response.data);
    });
  });

  socket.on('SIGN-IN', async payload => {
    let options = {
      method: 'POST',
      url: `${apiServerUrl}signin`,
      headers: {
        authorization: 'Basic ' + base64.encode(payload.name + ':' + payload.password),
      },
    };
    axios.request(options).then(function (response) {
      socket.emit('LOGGED-IN', response.data);
    });
  });

  socket.on('JOIN', room => {
    console.log('room joined:', room);
    socket.join(room);
  });



  socket.on('NEW-MESSAGE', async payload => {
    console.log('server : new message received : ' + payload.message);
    const prompt = `You are a short text-based adventure game AI. Start by asking what kind of adventure game would the human like to play. All the games finish withing 10 turns. ${messages.join('\n')} user: ${payload.message} AI:`;

    const params = {
      prompt: prompt,
      model: 'text-davinci-003',
      max_tokens: 256,
      temperature: 0,
    };

    try {
      client
        .post('https://api.openai.com/v1/completions', params)
        .then((result) => { 
          games.emit('AI-REPLY', {
            messageId: payload.messageId,
            message: result.data.choices[0].text.trim(),
            queueId: payload.queueId,
            event: 'AI-REPLY',
          });
        }).catch((err) => { console.log(err); });
    } catch (e) {
      console.log(e.message);
    }
  });
});

server.listen(PORT);
