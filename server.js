const express = require('express');
const cors = require('cors');
const morgan = require('morgan')
const bodyParser = require('body-parser');

const app = express();
const port = 3333;

// Middelware
var corsOptions = { 
    origin: 'http://projects.ritter.co.za',
    optionsSuccessStatus: 200,
    credentials: true
};

app.use(cors(corsOptions));

app.use(morgan('tiny'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));


var http = require('http').createServer(app); 
var io = require('socket.io')(http);

let users = []

io.on('connection', function(socket){
    console.log('User Connected');
    sendUserList()

    socket.on('registerUser', function(data){
        console.log('Registering User:', data.name)
        if(!userExists(data.name)) {
            users.push({name: data.name, socket: socket.id})
            // send success
            socket.emit('registerCallback', true)
            io.emit('chatMessageResponse', {user: data.name, message: `${data.name} joined the chat! Let's get this party started.`, isConnection: true})
            sendUserList()
        } else {
            // send error, user name exists
            socket.emit('registerCallback', false)
        }
    });
    

    socket.on('disconnect', function(reason){
        console.log('User disconnected from app')
        // Delete user from list
        if(deleteUser(socket.id)) {
            // user found and deleted
            sendUserList()
        } else {
            console.log('Cannot delete user. Not found')  
        }
    });

    socket.on('chatMessageRequest', function(user, message){
        io.emit('chatMessageResponse', {user: user, message: message, isNew: true})
    });
    
});

function sendUserList() {
    let formatted = []
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        formatted.push(user.name)
    }
    console.log('sending user list', formatted)
    io.emit('userList', formatted)
}

function userExists(name) {
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if(name === user.name) return true
    }

    return false
};

function deleteUser(socketID) {
    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if(socketID === user.socket) {
            users.splice(i,1)
            return true
        }
    }

    return false
};


io.listen(port, () => console.log(`Listening on port ${port}!`))