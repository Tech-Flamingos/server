'use strict';

require ('dotenv').config ();
const {Server} = require ('socket.io');
const PORT = process.env.PORT || 3002;
const server = new Server ();
const games = server.of ('/games');
const base64 = require('base-64');
var axios = require('axios');
const apiServerUrl = 'http://localhost:3001/';

let messages = [];

games.on ('connection', socket => {
  console.log ('socket connected to the game namespace', socket.id);

  socket.on ('SIGN-UP', async payload => {
    let options = {
      method: 'POST',
      url: `${apiServerUrl}signup`,
      data: {name: payload.name, password: payload.password, role: payload.role},
    };
    axios.request(options).then(function (response) {
      console.log(response.data.data);
      socket.emit('SIGN-UP', response.data.data);
    });
  });
  socket.on ('SIGN-IN', async payload => {
    let options = {
      method: 'POST',
      url: `${apiServerUrl}signin`,
      Authorization: 'Basic ' + base64.encode(payload.name + ':' + payload.password),
    };
    axios.request(options).then(function (response) {
      console.log(response.data);
      socket.emit('SIGN-UP', response.data);
    });
  });
  
  socket.on ('JOIN', room => {
    console.log ('room joined:', room);
    socket.join (room);
  });

  socket.on ('NEW-MESSAGE', async payload => {
    console.log ('server : new message received' + payload.messages);
    const openAIKey = process.env.OPEN_AI_KEY;
    const prompt = `You are a short text-based adventure game AI. Start by asking what kind of adventure game would the human like to play. All the games finish withing 10 turns. 
    ${messages.join ('\n')}
    user: ${payload.message}
    AI:`;
    const completionsUrl = 'https://api.openai.com/v1/completions';
    const maxTokens = 256;
    //console.log ('OpenAIAPIKEY', openaiApiKey);

    //console.log ('Prompt', prompt);
    try {
      const response = await fetch (completionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAIKey}`,
        },
        body: JSON.stringify ({
          model: 'text-davinci-003',
          prompt: prompt,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });
      const data = await response.json ();
      const aiReply = data.choices[0].text.trim ();

      games.emit ('AI-REPLY', {
        messageId: payload.messageId,
        message: aiReply,
        queueId: payload.queueId,
        event: 'AI-REPLY',
      });
      messages.push (`user:${payload.message}`);
      messages.push (`AI reply: ${aiReply}`);

      /**
       * user1: 3
       * AI: good choice....mystery..on an Island
       * user: let's play
       * Ai: you are .....story ... left or right
       * user: left
       * AI:  you chose left..there is door and a window
       * user2: door
       * AI: you open the door.....secret...
       * user3: yes open it
       * AI: (message will be emitted to all the users)
       */

      if(messages.length > 20 ){
        messages.shift();
      }
    } catch (e) {
      console.log (e.message);
    }
  });
});

server.listen(PORT);
