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

let messagesObj = {};
//axios client
const client = axios.create({
  headers: {
    Authorization: 'Bearer ' + openAIKey,
  },
});
//Finds all room keys with room in the name.
//rooms are es6 maps
function findRooms(socket) {
  var availableRooms = [];
  socket.adapter.rooms.forEach((value, key) => {
    if (key.includes('room')){
      availableRooms.push(key);
    }
  });
  return availableRooms;
}

function aiInit(userRoom){
  messagesObj[userRoom] = [];
  messagesObj[userRoom].push({ 'role': 'system', 'content': 'You are a text-based adventure game AI like the choose your own adventure books. Start by giving the user 3 different adventure options. When the user responds continue the story using the users response. then generate 3 options for the user to continue the story numbered 1-3' });
  const params = {
    messages: messagesObj[userRoom],
    model: 'gpt-3.5-turbo',
    max_tokens: 256,
    temperature: 0.7,
  };

  try {
    client
      .post('https://api.openai.com/v1/chat/completions', params)
      .catch((err) => { console.log(err); });
  } catch (e) {
    console.log(e.message);
  }
  console.log('AI INIT');
}

games.on('connection', (socket) => {
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

  socket.on('NEW-MESSAGE', async payload => {
    console.log('server : new message received : ' + payload.message);
    messagesObj[payload.room].push({ 'role': 'system', 'content': `${payload.message}` });
    const params = {
      messages: messagesObj[payload.room],
      model: 'gpt-3.5-turbo',
      max_tokens: 256,
      temperature: 0.7,
    };
    try {
      client
        .post('https://api.openai.com/v1/chat/completions', params)
        .then((result) => {
          messagesObj[payload.room].push({ 'role': `${result.data.choices[0].message.role}`, 'content': `${result.data.choices[0].message.content}` });
          games.emit('AI-REPLY', {
            message: result.data.choices[0].message.content,
            event: 'AI-REPLY',
          });
        }).catch((err) => { console.log(err); });
    } catch (e) {
      console.log(e.message);
    }
  });

  socket.on('NEW-GAME', (payload) => {
    let userRoom = 'room: ' + payload.user.name;
    socket.join(userRoom);
    // aiInit(userRoom);
    socket.emit('START-GAME', { ...payload, userRoom: userRoom });
  });

  // socket.on('CONTINUE-GAME', (payload) => {
  //   socket.join('room: ' + payload.name);
  // });

  socket.on('VIEW-GAMES', (payload) => {
    let allRooms = findRooms(socket);
    socket.emit('ALL-ROOMS', { ...payload, allRooms });
  });

  socket.on('JOIN-ROOM', (payload) => {
    console.log(payload);
    socket.join(payload.userRoom);
    console.log('Joined', payload.userRoom);
  });

});

server.listen(PORT);
