import express from "express"
import cors from "cors"
import mongoose from "mongoose"
import cookieParser from "cookie-parser"
import userRouter from "./Router/user.js"
import adminRouter from "./Router/admin.js"
import dotenv from "dotenv"
import session from "express-session"

dotenv.config()

const app=express()

app.listen(3001,()=>{
    console.log("connected 3001");
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