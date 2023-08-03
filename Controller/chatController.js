// import { io } from "../index.js"

import mongoose from "mongoose"
import { chatSchema } from "../Model/ChatModel.js"
import { messageSchema } from "../Model/MessageModel.js"
import { postSchema } from "../Model/postModel.js"

const chat = async (req, res, next) => {
    try{
       const {client,freelancer, post_id} = req.body
       const obj = {}
       if(!client || !freelancer){
            obj.status = false
            obj.message = "Something wrong!"
       }else{
            const isChat = await chatSchema.findOne({
                $and:[{users:{$elemMatch:{$eq:client}}},{users:{$elemMatch:{$eq:freelancer}}}]
            }).populate("users","-profile.password")
            
            if(isChat){
               obj.status = true
               obj.chat = isChat 
            }else{
                const chatObj = {
                    users:[client,freelancer],
                    displayName:"sender"
                }
                const createdChat = await chatSchema.create(chatObj)
                const fullChat = await chatSchema.findOne({_id:createdChat._id}).populate("users","-profile.password")
                obj.status = false
                obj.chat = fullChat
            }
            await postSchema.updateOne({_id:new mongoose.Types.ObjectId(post_id)},{$set:{selected:new mongoose.Types.ObjectId(freelancer)}})
            res.json(obj)
       }  
    }catch(err){    
        console.log(err)
    }
}

const getChatList = async (req, res, next) => {
    try{
        const user_id = req.params.user_id    
        const fullChat = await chatSchema.find({users:{$in:[user_id]}}).populate("users","-profile.password").populate("lastMessage").sort({updatedAt:-1})
        res.json({status:true,list:fullChat})
    }catch(err){
        console.log(err)
    }
}

const sendMessage = async (req, res, next) => {
    try{
        const {sender,content,chat_id} = req.body.messageData
        const obj = {
            sender:new mongoose.Types.ObjectId(sender),
            content:content,
            chat_id:new mongoose.Types.ObjectId(chat_id)
        }
        let message = await messageSchema.create(obj)
        message = await message.populate("sender","profile.full_name profile.image")
        message = await message.populate("chat_id")
        message = await message.populate("chat_id.users")
        await chatSchema.updateOne({_id:new mongoose.Types.ObjectId(chat_id)},{$set:{lastMessage:content}})
        res.json({message})
    }catch(err){
        console.log(err)
    }
}

const getAllMessages = async (req, res, next) => {
    try{
        let messages = await messageSchema.find({chat_id:new mongoose.Types.ObjectId(req.params.chat_id)})
        .populate("sender","profile.full_name profile.username profile.image")
        .populate("chat_id")
        res.json({messages})
    }catch(err){
        console.log(err)
    }
}

const unreadMessage = async (req, res, next) => {
    try{
        const {receiver,chat, setZero} = req.body
        const findChat = await chatSchema.findOne({_id:new mongoose.Types.ObjectId(chat)})
        const setValue = setZero ? 0 : findChat?.[receiver] + 1
        const setNow = setZero ? false : true 
        console.log(await chatSchema.updateOne({_id:new mongoose.Types.ObjectId(chat)},{$set:{[receiver]:setValue}},{timestamps:setNow}))
        res.json({status:true,unread:setValue})
    }catch(err){
        console.log(err)
    }
}

export default { chat, getChatList, sendMessage, getAllMessages, unreadMessage }