import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import userRouter from "./Router/user.js"
import adminRouter from "./Router/admin.js"
import chatRouter from "./Router/chat.js"
import dotenv from "dotenv"
import session from "express-session"
import { Server } from "socket.io"

dotenv.config()

const app=express()

const server = app.listen(3001,()=>{
    console.log("connected 3001");
})

const io = new Server(server,{
    pingTimeout:60000,
    cors:{
        origin:process.env.origin
    }
})

io.on("connection",(socket)=>{

    socket.on("setup",(user_id)=>{
        socket.join(user_id)
    })

    socket.on("join_chat",(room)=>{
        socket.join(room)
    })

    socket.on("new_message",(messageData)=>{
        const chat = messageData.chat_id
        if(!chat.users){ console.log("not defined!"); return}
        chat.users.forEach(user => {
            if(user._id === messageData.sender._id) return
            socket.in(user._id).emit("receive_message",messageData)
        })
    })

    socket.on("typing", (room) => socket.in(room).emit("typing"))
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"))


    socket.on("join-video-chat", async ({room_id, user_id}) => {
        await socket.join(room_id)
        socket.to(room_id).emit("newUser", user_id)
    })

    socket.on("sendMessageToPeer",(data) =>{
        socket.to(data.user_id).emit("receivedPeerToPeer",data)
    })
})

app.use(session({secret:"thiskey12309737",resave: false,saveUninitialized: true, cookie:{maxAge:1*60*5*1000}}))
app.use(cookieParser())
app.use(express.json());
app.use(cors({
    origin: [process.env.origin],
    methods: ["GET", "POST"],
    credentials: true
}))

mongoose.connect(process.env.db_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Database connect successfully");
}).catch((error) => {
    console.log(error.message)
})

app.use('/',userRouter)
app.use('/admin',adminRouter)
app.use('/chat',chatRouter)