import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const user = new mongoose.Schema({
    // user_id:{
    //     type:String,
    //     required:true
    // },
    profile:{
        full_name:{
            type:String,
            required:true
        },
        username:{
            type:String,
            required:true
        },
        account_type:{
            type:String,
            required:true
        },
        image:{
            type:String,
            default:process.env.cloudinary + "/avatar.png"
        },
        email:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true
        },
        is_verified:{
            type:Boolean,
            default:false
        }
    }
})

export const userSchema = mongoose.model("users",user)