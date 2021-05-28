var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var activeUsers = [];
var express = require('express')
app.use(express.static('public'))
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

    socket.on('set-online', function(user) {
        socket.id = user.username;
        activeUsers.push(socket.id)
        socket.broadcast.emit('joined', user.username)
        console.log(activeUsers)
        io.emit("online", activeUsers)
    })

    socket.on('check-username', function(username) {
        var found = false;
        if (activeUsers.includes(username)) {
            found = true;
        }
        if (!found) {
            socket.emit('verify-username', '1');
        } else {
            socket.emit('verify-username', '0');
        }
    })

    socket.on('message', function(msg, inbox) {

        socket.broadcast.emit("broadcastMessage", msg);
    });

    socket.on('nagtype', function(data) {
        socket.broadcast.emit('nagtype', data)
        console.log(data.typing?`${data.user} is typing`:"")

    })
    socket.on('waytype', function(data) {
        socket.broadcast.emit('waytype', data.typing?"":`${data.user} is typing`)
    })

    socket.on('disconnect', function(e) {
        for (let i = 0; i < activeUsers.length; i++) {
            if (activeUsers[i] == socket.id) {
                socket.broadcast.emit('leave', activeUsers[i])
                activeUsers.splice(i, 1);
                break;
            }
        }
        io.emit("logout", socket.id)
    })
});

http.listen(port, function() {
    console.log('server started !\nhttp://127.0.0.1:' + port);
});