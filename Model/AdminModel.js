import mongoose from "mongoose"

const admins = new mongoose.Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    name:{
        type:String
    },
    username:{
        type:String
    },
    payouts:{
        type:Array
    }
})

export const adminSchema = mongoose.model("admins",admins)