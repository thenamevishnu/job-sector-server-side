import mongoose from "mongoose"
import { postSchema } from "../Model/postModel.js"
import { userSchema } from "../Model/userModel.js"

const postJob = async (req, res, next) => {
    try{
        const {postData} = req.body
        postData.posted = new Date().getTime()
        const data = await postSchema.insertMany([postData])
        console.log(data);
        res.json({status:true})
    }catch(err){
        console.log(err)
    }
}

const getPostData = async (req, res, next) => {
    try{
        const postData = await postSchema.aggregate([
            {
                $lookup:{
                    from:"users",
                    localField:"user_id",
                    foreignField:"_id",
                    pipeline:[{
                        $project:{
                            _id:1,
                            "profile.rating":1,
                            spent:1,
                            "profile.country":1,
                            "profile.image":1,
                            "profile.is_verified":1
                        }
                    }],
                    as:"auther"
                }
            }
        ])
        res.json({status:true,postInfo:postData})
    }catch(err){
        console.log(err)
    }
}

const getSinglePost = async (req, res, next) => {
    try{
        const post_id = req.params.id
        const postData = await postSchema.aggregate([
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(post_id)
                }
            },{
                $lookup:{
                    from:"users",
                    localField:"user_id",
                    foreignField:"_id",
                    pipeline:[{
                        $project:{
                            _id:1,
                            "profile.full_name":1,
                            "profile.title":1,
                            "profile.rating":1,
                            spent:1,
                            "profile.country":1,
                            "profile.image":1,
                            "profile.is_verified":1
                        }
                    }],
                    as:"auther"
                }
            }
        ])
        const related = await postSchema.aggregate([
            {
                $match:{
                    _id:{
                        $ne:new mongoose.Types.ObjectId(post_id)
                    },
                    skillsNeed:{
                        $in:postData[0]?.skillsNeed
                    }
                }
            },{
                $lookup:{
                    from:"users",
                    localField:"user_id",
                    foreignField:"_id",
                    pipeline:[{
                        $project:{
                            _id:1,
                            "profile.rating":1,
                            spent:1,
                            "profile.country":1,
                            "profile.image":1,
                            "profile.is_verified":1
                        }
                    }],
                    as:"auther"
                }
            }
        ])
        res.json({status:true,postData:postData,related:related})
    }catch(err){
        console.log(err)
    }
}

const saveJobs = async (req, res, next) => {
    try{
        const obj = {}
        const {post_id,user_id} = req.body
        const response = await userSchema.findOne({_id:user_id,saved_jobs:post_id})
        if(!response){
            obj.status = true
            obj.message = "Job added to saved list"
            await userSchema.updateOne({_id:user_id},{$push:{saved_jobs:post_id}})
        }else{
            obj.status = false
            obj.message = "Job already saved!"
        }
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const sendProposal = async (req, res, next) => {
    try{
        const obj = {}
        const {post_id,user_id} = req.body
        const response = await userSchema.findOne({_id:user_id,my_proposals:post_id})
        if(!response){
            const response1 = await postSchema.updateOne({_id:post_id},{$push:{proposals:user_id}})
            const response2 = await userSchema.updateOne({_id:user_id},{$push:{my_proposals:post_id}}) 
            if(response1.modifiedCount === 1 && response2.modifiedCount === 1){
                obj.status = true
                obj.message = "Proposal sent!"
            }else{
                obj.status = false
                obj.message = "Something error happend!"
            }
        }else{
            obj.status = false
            obj.message = "Proposal already sent!"
        }
        const info = await postSchema.findOne({_id:post_id})
        obj.response = info?.proposals
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const getMyPost = async (req, res, next) => {
    try{
        const user_id = req.params.id
        const allPosts = await postSchema.find({user_id:user_id})
        res.json({posts:allPosts})
    }catch(err){
        console.log(err)
    }
}

export default {postJob, getPostData, getSinglePost, saveJobs, sendProposal, getMyPost}