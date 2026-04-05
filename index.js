const express = require('express')
const http = require('http')
const path = require('path')
const { Server } = require("socket.io")

const port = 8000
const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(path.join(__dirname, "public")))

const userToId = {}
const idToUser = {}
const rooms = {
    '1234': [],
    '5678': []
}
const removeUser = (socketId) => {
    const currUser = idToUser[socketId]
    if (!currUser) return

    delete idToUser[socketId]
    delete userToId[currUser]

    io.emit("online-users", Object.values(idToUser))
}

//sockets
io.on("connection", (socket) => {
    console.log(`new user has been connected`);
    console.log('id:', socket.id);

    socket.on("disconnect", (reason) => {
        removeUser(socket.id)
    })

    socket.on("client-msg", msg => {
        console.log('new message from client:', msg);
        if (idToUser[socket.id] && msg) {
            io.emit("server-msg", {
                "username": idToUser[socket.id],
                "msg": msg
            })
        }
    })

    socket.on("join", username => {
        if (socket.id in idToUser) {
            socket.emit("join-error", "user already joined")
            return
        }
        if (username in userToId) {
            socket.emit("join-error", "username already taken")
            return
        }
        userToId[username] = socket.id
        idToUser[socket.id] = username

        console.log(userToId, "\n", idToUser)

        socket.emit("join-success", "user joined !!");

        io.emit("online-users", Object.values(idToUser))
    })

    socket.on("leave", () => {
        removeUser(socket.id)
    })

    socket.on("prsnMsgToServer", ({ msg, to }) => {
        let idToSend = userToId[to]
        // idToSend && socket.emit("prsnMsgFromServer", msg)
        console.log('prsnMsgToServer: ', msg, "to: ", to, "from: ", idToUser[socket.id]);
        io.to(idToSend).emit("prsnMsgFromServer", { "from": idToUser[socket.id], msg })
    })

    socket.on("joinRoom", ({ username, roomId }) => {
        console.log('username:', username);
        console.log('roomId:', roomId);
        console.log(userToId[username]);
        if (!username || !roomId) {
            socket.emit("join-error", "invalid credentials")
            return
        }
        if (!(roomId in rooms) || !userToId[username]) {
            socket.emit("join-error", "either username or roomId doesn't exist")
            return
        }

        rooms[`${roomId}`].push(userToId[username])
        console.log('room:', rooms[`${roomId}`]);

        socket.emit("join-success", "suceesully joined room")
    })
})

// app.get("/", (req,res)=>{
//     res.sendFile("/public/index.html")
// })

server.listen(port, () => {
    console.log('app is live at port:', port);
})