var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const { timeStamp } = require('console');
const { random } = require('pokemon');
var pokemon = require('pokemon');
const { on } = require('process');

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let onUsersList = [];
let messageLog = [];
let usersMap = new Map();

io.on('connection', (socket) => { 

  // Random username generation
  while(true) {
    let randomName = pokemon.random() + Math.round(Math.random() * 100).toString();

    if (onUsersList.includes(randomName) === false) {
      io.sockets.connected[socket.id].emit('new user', { user: randomName, log: messageLog, onlineUsers: onUsersList });
      break;
    }
  }

  // New user joins and added to user's list
  socket.on('online user', (newUser) => {
    usersMap.set(socket.id, {username: newUser, color: '#FFFFFF'});
    onUsersList.push(newUser);
    io.emit('online users', onUsersList);

    console.log('user connected: id- ' + socket.id + ' name- ' + usersMap.get(socket.id).username);
  }); 

  // Handle user disconnects 
  socket.on('disconnect', function() {
    let username = usersMap.get(socket.id).username;

    for (let i = 0; i < onUsersList.length; i++) {
      if (i === onUsersList.indexOf(username)) {
        onUsersList.splice(i, 1);
      }
    }

    console.log('user disconnected: id-', socket.id + ' name- ' + username);
    usersMap.delete(socket.id);
    io.emit('user disconnected', onUsersList);
  });

  // Handle messages
  socket.on('chat message', msg => {
    let date = new Date();
    let timeStamp = date.getHours() + ":" + (date.getMinutes() < 10 ? '0':'') + date.getMinutes();

    let user = usersMap.get(socket.id);
    let messageDetails = { time: timeStamp, username: user.username, color: user.color, message: msg, clientID: socket.id }
    checkCommand(msg, messageDetails);
  });

  // Check and handle commands
  function checkCommand(msg, messageDetails) {
    if (msg.startsWith('/')) {
      let command = msg.split(" ");

      if (command[0] === '/name') {
        if (checkDuplicate(command[1]) === false) {
          if (command[1] !== '' && command[1] !== undefined) {
            let currentName = usersMap.get(socket.id).username;
            let currentColor = usersMap.get(socket.id).color;

            onUsersList[onUsersList.indexOf(usersMap.get(socket.id).username)] = command[1];
            io.emit('online users', onUsersList);
            usersMap.set(socket.id, { username: command[1], color: currentColor });
            io.sockets.connected[socket.id].emit('username changed', command[1]);
            io.sockets.connected[socket.id].emit('update message', 'Username changed from ' + currentName + ' to ' + command[1]);
            
          } else {
            io.sockets.connected[socket.id].emit('error message', "Invalid username");
          }
        } else {
          io.sockets.connected[socket.id].emit('error message', 
          "Username already exists");
        }
      } else if (command[0] === '/color') {
        if (command[1] !== '' && command[1] !== undefined && 
        validColor(command[1]) === true) {
          let currentName = usersMap.get(socket.id).username;
          let currentColor = usersMap.get(socket.id).color;

          usersMap.set(socket.id, { username: currentName, color: '#' + command[1] });
          io.sockets.connected[socket.id].emit('update message', 'Color changed from ' + currentColor.substring(1) + ' to ' + command[1]);
        } else {
          io.sockets.connected[socket.id].emit('error message', "Invalid color");
        }
      } else {
        io.sockets.connected[socket.id].emit('error message', "Invalid command");
      }
    } else {
      io.emit('chat message', messageDetails);
      messageLog.push(messageDetails);
    }
  }
});

  function checkDuplicate(name) {
    for (let i = 0; i < onUsersList.length; i++) {
      if (onUsersList[i] === name) {
        return true;
      }
    }
    return false;
  }

  // Helped from https://mkyong.com/regular-expressions/how-to-validate-hex-color-code-with-regular-expression/
  function validColor(color) {
    let exp = /(^[0-9A-Fa-f]{6}$)|(^[0-9A-F]{3}$)/i;
    return exp.test(color);
  }

// Listening on port 3000
http.listen(3000, () => {
  console.log('listening on 3000');
});