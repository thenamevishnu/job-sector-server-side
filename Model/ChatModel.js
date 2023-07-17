import mongoose from "mongoose";

const chat = new mongoose.Schema({
    displayName:{
        type:String,
        required:true
    },
    users:[{
        type: mongoose.Types.ObjectId,
        ref:"users"
    }],
    lastMessage:{
        type:String
    }
},{
    timestamps:true,
    strict:false
})

export const chatSchema = mongoose.model("chats",chat)