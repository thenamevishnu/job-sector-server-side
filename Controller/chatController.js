// import { io } from "../index.js"

const chat = async () => {
    try{
        // io.on("connection",(socket) => {
        //     console.log(`New User Connected : ${socket.id}`);
        // })
    }catch(err){    
        console.log(err)
    }
}

export default { chat }