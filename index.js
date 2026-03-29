const express = require('express')
const http = require('http')
const path = require('path')
const { Server } = require("socket.io")

const port = 8000
const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(path.join(__dirname, "public")))

//sockets
io.on("connection", (socket) => {
    console.log(`new user has been connected`);
    console.log('id:', socket.id);
    socket.on("disconnect", (reason) => {
        console.log(`user disconnected`);
    })
    socket.on("client-msg", msg => {
        console.log('new message from client:', msg);
        io.emit("server-msg", msg)
    })
})

// app.get("/", (req,res)=>{
//     res.sendFile("/public/index.html")
// })

server.listen(port, () => {
    console.log('app is live at port:', port);
})