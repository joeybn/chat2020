var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

let newClientID = 1000;
let connectedClients = [];
let chatLog = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){

  let clientID = newConnection(socket);

  //listen for disconnect
  socket.on('disconnect', function(){
    connectedClients = connectedClients.filter(function(value, index, arr){
      return value.clientID !== clientID;
    });
    io.emit('userList', connectedClients);
  });

  //listen for new messages and send to all clients
  socket.on('chat message', function(clientMsgObj){
    if (clientMsgObj.message != '') //message is not empty
    {
      let msgObj = {
        timeStamp : getTimeStamp(),
        message : clientMsgObj.message,
        username : clientMsgObj.username,
        color: clientMsgObj.color
      };
      io.emit('chat message', msgObj);
      chatLog.push(msgObj);
    }
  });

  socket.on('changeUsername', function(changedUsername){
    let oldUsername = changedUsername.oldUsername;
    let newUsername = changedUsername.newUsername;
    let success = true;
    connectedClients.forEach(function(client){
      if (client.clientUsername === newUsername){
        success = false;
        console.log("change name fail: ");
        console.log(connectedClients);
      }
    });
    if (success === true){
      connectedClients.forEach(function(client){
        if (client.clientUsername === oldUsername){
          client.clientUsername = newUsername;
          console.log("change name success: ");
          console.log(connectedClients);
        }
      });
    }
    socket.emit('changeUserSuccess', success);
    io.emit('userList', connectedClients);
    console.log("change name DONE");
  });

  socket.on('setUpFinished', function(){
    //send chat history to client
    socket.emit('chatHistory', chatLog);
  });
});

function newConnection(socket){
  //create a default username
  let clientUsername = "Guest" + newClientID;
  let clientID = newClientID;
  newClientID++;

  //send default username information to client
  socket.emit('clientInfo', clientInfoObj = {
    clientUsername: clientUsername,
    clientID: clientID
  });

  //add client to list of current users
  connectedClients.push({"clientID": clientID, "clientUsername": clientUsername});
  io.emit('userList', connectedClients);

  return clientID;
}

function getTimeStamp(){
  let today = new Date();
  let hour = today.getHours();
  let minutes = today.getMinutes();
  if (minutes < 10){
    minutes = '0' + minutes;
  }
  if (hour >= 13){
    return timeStamp = (hour - 12) + ':' + minutes + ' PM';
  }
  else{
    return timeStamp = hour + ':' + minutes + ' AM';
  }
}

http.listen(port, function(){
  console.log('listening on *:' + port);
});
