import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config()

const posts = new mongoose.Schema({
    user_id:{
        type:mongoose.Types.ObjectId,
        required:true
    },
    selected:{
        type:mongoose.Types.ObjectId
    },
    status:{
        type:Boolean,
        default:1
    },
    title:{
        type:String,
        required:true
    },
    experience:{
        type:String,
        required:true
    },
    jobType:{
        type:String,
        required:true
    },
    priceRange:{
        from:{
            type:Number,
            required:true
        },
        to:{
            type:Number,
            required:true
        }
    },
    connectionsNeed:{
        from:{
            type:Number,
            required:true
        },
        to:{
            type:Number,
            required:true
        }
    },
    description:{
        type:String,
        required:true
    },
    skillsNeed:{
        type:Array,
        required:true
    },
    posted:{
        type:Number
    },
    proposals:{
        type:Array,
        default:[]
    },
    completed:{
        type:Boolean,
        default:0
    }
})

export const postSchema = mongoose.model("posts",posts)