import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import userRouter from "./Router/user.js"
import adminRouter from "./Router/admin.js"
import dotenv from "dotenv"
import session from "express-session"
import { Server, Socket } from "socket.io"

dotenv.config()

const app=express()

const server = app.listen(3001,()=>{
    console.log("connected 3001");
})

const io = new Server(server,{
    cors:{
        origin:process.env.origin,
        methods:["GET","POST"]
    }
})

io.on("connection",(socket)=>{

    socket.on("join_room",(room)=>{
        socket.join(room)
    })

    socket.on('sendMessage',(data)=>{
        console.log(data);
        socket.to(data.room).emit("receivedMessage",data)
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