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
            required:true,
            unique:true
        },
        account_type:{
            type:String,
            required:true
        },
        image:{
            type:String,
            default:"/job/default/avatar.png"
        },
        audio:{
            type:String
        },
        email:{
            type:String,
            required:true,
            unique:true
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
        },
        hoursPerWeek:{
            type:String,
            default:"More than 30 hrs/week"
        },
        language:{
            type:Array,
            default:[]
        },
        education:{
            type:Array,
            default:[]
        },
        title:{
            type:String,
            default:"Data Entry"
        },
        description:{
            type:String,
            default:"I am a data entry freelancer."
        },
        work_history:{
            type:Array,
            default:[]
        },
        skills:{
            type:Array,
            default:[]
        },
        my_projects:{
            type:Array,
            default:[]
        },
        certificates:{
            type:Array,
            default:[]
        },
        employment_history:{
            type:Array,
            default:[]
        },
        per_hour:{
            type:Number,
            default:1,
        },
        signup_method:{
            type:String,
            default:null
        }
    }
})

export const userSchema = mongoose.model("users",user)