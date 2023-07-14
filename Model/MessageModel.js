import mongoose from "mongoose";

const message = new mongoose.Schema({
    sender:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"users"
    },
    content:{
        type:String,
        required:true
    },
    chat_id:{
        type:mongoose.Types.ObjectId,
        required:true,
        ref:"chats"
    }
},{
    timestamps:true
})

export const messageSchema = mongoose.model("messages",message)
