const express = require('express')
const http = require('http')
const path = require('path')
const { Server } = require("socket.io")

const port = 8000
const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(path.join(__dirname, "public")))

const userDB = {}
const groupChats = {}

//sockets
io.on("connection", (socket) => {
    console.log(`new user has been connected`);
    console.log('id:', socket.id);

    socket.on("disconnect", (reason) => {
        let currUser = userDB[socket.id]
        currUser && delete userDB[currUser]
        delete userDB[socket.id]
        currUser && console.log(`${currUser} disconnected`);
    })

    socket.on("client-msg", msg => {
        console.log('new message from client:', msg);
        // groupChats[userDB[socket.id]] = msg
        // console.log('group chats:', groupChats);
        if (userDB[socket.id] && msg) {
            io.emit("server-msg", {
                "username": userDB[socket.id],
                "msg": msg
            })
        }
    })

    socket.on("join", username => {
        if (socket.id in userDB) {
            socket.emit("join-error", "user already joined")
            return
        }
        if (username in userDB) {
            let oldSocketId = userDB[username]
            delete userDB[oldSocketId]
        }
        userDB[username] = socket.id
        userDB[socket.id] = username
        console.log("users : ", userDB);

        socket.emit("join-success", "user joined !!");
    })
})

// app.get("/", (req,res)=>{
//     res.sendFile("/public/index.html")
// })

server.listen(port, () => {
    console.log('app is live at port:', port);
})