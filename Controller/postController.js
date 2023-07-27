import { postSchema } from "../Model/postModel.js"
import { userSchema } from "../Model/userModel.js"
import {prefix} from "../Trie/Trie.js"
import mongoose from "mongoose"

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

const searchSuggestion = async (req, res, next) => {
    try{
        const prefixWord = req.params.query
        const getAllData = await postSchema.aggregate([
            {
                $match:{
                    status:true,
                    completed:false
                }
            },{
                $unwind:"$skillsNeed"
            },
            {
                $group:{
                    _id:null,
                    title:{
                        $addToSet:"$title"
                    },
                    skillsNeed:{
                        $addToSet:"$skillsNeed"
                    }
                }
            },
            {
                $project: {
                  _id: 0,
                  title: 1, 
                  skillsNeed: 1
                }
            }
        ])
        const newArray = getAllData?.length > 0 ? [...getAllData[0]?.title,...getAllData[0]?.skillsNeed] : []
        console.log(newArray);
        prefix.UploadArray(newArray)
        const response = prefix.searchResponse(prefixWord)
        // console.log(response);
        res.json({status:true,response:response})
    }catch(err){
        console.log(err)
    }
}

const updateJob = async (req, res, next) => {
    try{
        const {postData} = req.body
        const {post_id,user_id,...rest} = postData
        const data = await postSchema.updateOne({_id:new mongoose.Types.ObjectId(postData.post_id)},{$set:rest})
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
                $match:{
                    status:true,
                    completed:false
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
            },{
                $sort:{
                    posted:-1
                }
            }
        ])
        res.json({status:true,postInfo:postData})
    }catch(err){
        console.log(err)
    }
}

const searchResult = async (req, res, next) => {
    try{
        const search = req.params.query
        const postData = await postSchema.aggregate([
            {
                $match:{
                    status:true,
                    completed:false,
                    $or:[
                        {
                            title:{
                                $regex:search,$options:"i"
                            }
                        },{
                            skillsNeed:{
                                $regex:search,$options:"i"
                            }
                        }
                    ]
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
            },{
                $sort:{
                    posted:-1
                }
            }
        ])
        res.json({status:true,response:postData})
    }catch(err){
        console.log(err)
    }
}

const getLatest = async (req, res, next) => {
    try{
        const postData = await postSchema.aggregate([
            {
                $match:{
                    status:true,
                    completed:false
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
            },{
                $sort:{
                    posted:-1
                }
            },{
                $limit:6
            }
        ])
        res.json({status:true,postData:postData})
    }catch(err){
        console.log(err)
    }
} 

const getSaved = async (req, res, next) => {
    try{
        const getSave = await userSchema.findOne({_id:req.params.id})
        const postData = await postSchema.aggregate([
            {
                $match:{
                    _id:{
                        $in:getSave.saved_jobs
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
            },{
                $sort:{
                    posted:-1
                }
            }
        ])
        res.json({status:true,postData:postData})
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
                    _id:new mongoose.Types.ObjectId(post_id),
                    status:true,
                    completed:false
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
                        $ne:new mongoose.Types.ObjectId(post_id),
                    },
                    completed:false,
                    status:true,
                    skillsNeed:{
                        $in:postData[0]?.skillsNeed ?? []
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
        const response = await userSchema.findOne({_id:user_id,saved_jobs:new mongoose.Types.ObjectId(post_id)})
        const data = await userSchema.findOne({_id:user_id})
        if(!response){
            obj.status = true
            obj.message = "Job added to saved list"
            obj.total = parseInt(data?.saved_jobs?.length) + 1
            await userSchema.updateOne({_id:user_id},{$push:{saved_jobs:new mongoose.Types.ObjectId(post_id)}})
        }else{
            obj.status = false
            obj.message = "Job already saved!"
            obj.total = parseInt(data?.saved_jobs?.length)
        }
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const setRejectedProposal = async (req, res, next) => {
    try{
        const obj = {}
        const {post_id,user_id} = req.body
        const exist = await userSchema.findOne({_id:user_id,rejected_jobs:new mongoose.Types.ObjectId(post_id)})
        if(exist){
            obj.status = false
            obj.message = "Already rejected!"
        }else{
            await userSchema.updateOne({_id:user_id},{$push:{rejected_jobs:new mongoose.Types.ObjectId(post_id)}})
            await userSchema.updateOne({_id:user_id},{$pull:{my_proposals:{post_id:new mongoose.Types.ObjectId(post_id),status:"Pending"}}})
            await postSchema.updateOne({_id:post_id},{$pull:{proposals:new mongoose.Types.ObjectId(user_id)}})
            obj.status = true
            obj.message = "Proposal rejected!"
        }
        const postData = await postSchema.findOne({_id:post_id})
        const userData = await userSchema.find({_id:{$in:postData.proposals}})
        obj.userData = userData
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const setAcceptedProposal = async (req, res, next) => {
    try{
        const obj = {}
        const {post_id,user_id} = req.body
        const done = await userSchema.findOne({_id:user_id,my_proposals:{$elemMatch:{post_id:new mongoose.Types.ObjectId(post_id),status:"Achieved"}}})
        if(done){
            obj.status = false
            obj.message = "Proposal Already Accepted!"
        }else{
            await userSchema.updateOne({_id:user_id},{$pull:{my_proposals:{post_id:new mongoose.Types.ObjectId(post_id),status:"Pending"}}})
            await userSchema.updateOne({_id:user_id},{$push:{my_proposals:{post_id:new mongoose.Types.ObjectId(post_id),status:"Achieved"}}})
            obj.status = true
            obj.message = "Proposal Accepted!"
        }
        const postData = await postSchema.findOne({_id:post_id})
        const userData = await userSchema.find({_id:{$in:postData.proposals}})
        obj.userData = userData
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const sendProposal = async (req, res, next) => {
    try{
        const obj = {}
        const {post_id,user_id} = req.body
        const userData = await userSchema.findOne({_id:user_id})
        const postData = await postSchema.findOne({_id:post_id})
        const response = await userSchema.findOne({_id:user_id,rejected_jobs:new mongoose.Types.ObjectId(post_id)})
        if(response){
            obj.status = false
            obj.message = "Can't send, because you're rejected before!"
        }else{
            if(userData?.profile?.connections?.count < postData?.connectionsNeed?.from){
                obj.status = false
                obj.warn = "warn"
                obj.message = `Need atleast ${postData?.connectionsNeed?.from} connections!`
            }else{
                const response = await userSchema.findOne({_id:user_id,"my_proposals.post_id":new mongoose.Types.ObjectId(post_id)})
                if(!response){
                    const response1 = await postSchema.updateOne({_id:post_id},{$push:{proposals:new mongoose.Types.ObjectId(user_id)}})
                    const response2 = await userSchema.updateOne({_id:user_id},{$push:{my_proposals:{post_id:new mongoose.Types.ObjectId(post_id),status:"Pending"}}}) 
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
            }
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

const getMyProposals = async (req, res, next) => {
    try{
        const user_id = req.params.id

        const getPosts = await userSchema.aggregate([
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(user_id)
                }
            },{
                $project:{
                    _id:1,
                    my_proposals:1
                }
            },{
                $unwind:"$my_proposals"
            },{
                $lookup:{
                    from:"posts",
                    localField:"my_proposals.post_id",
                    foreignField:"_id",
                    as:"post_info"
                }
            }
        ])
        res.json({status:true,postData:getPosts})
    }catch(err){
        console.log(err)
    }
}

const changePostStatus = async (req, res, next) => {
    try{
        await postSchema.updateOne({_id:req.params.id},{$set:{status:req.params.status}})
        const postData = await postSchema.find({user_id:req.params.user_id})
        res.json({status:true,postData:postData})
    }catch(err) {
        console.log(err)
    }
}

const deletePost = async (req, res, next) => {
    try{
        const {post_id,user_id} = req.body
        await userSchema.updateMany({},{$pull:{saved_jobs:new mongoose.Types.ObjectId(post_id),rejected_jobs:new mongoose.Types.ObjectId(post_id),my_proposals:{post_id:new mongoose.Types.ObjectId(post_id)}}})
        await postSchema.deleteOne({_id:post_id})
        const allPosts = await postSchema.find({user_id:user_id})
        res.json({status:true,postData:allPosts})
    }catch(err) {
        console.log(err)
    }
}

const completedPost = async (req, res, next) => {
    try{
        const {post_id,user_id} = req.body
        await postSchema.updateOne({_id:post_id},{$set:{completed:1}})
        const allPosts = await postSchema.find({user_id:user_id})
        res.json({status:true,postData:allPosts})
    }catch(err) {
        console.log(err)
    }
}

const bestMatch = async (req, res, next) => {
    try{
        const getUser = await userSchema.findOne({_id:req.params.id})
        const postData = await postSchema.aggregate([
            {
                $match:{
                    status:true,
                    completed:false,
                    skillsNeed:{
                        $elemMatch:{
                            $in:getUser.profile.skills
                        }
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
            },{
                $sort:{
                    posted:-1
                }
            }
        ])
        res.json({status:true,postData:postData})
    }catch(err){
        console.log(err)
    }
}

const removeSaved = async (req, res, next) => {
    try{    
        await userSchema.updateOne({_id:req.params.user_id},{$pull:{saved_jobs:new mongoose.Types.ObjectId(req.params.post_id)}})
        const getSave = await userSchema.findOne({_id:req.params.user_id})
        const postData = await postSchema.aggregate([
            {
                $match:{
                    _id:{
                        $in:getSave.saved_jobs
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
            },{
                $sort:{
                    posted:-1
                }
            }
        ])
        res.json({status:true,postData:postData})
    }catch(err){
        console.log(err)
    }
}

const getClientPost = async (req, res, next) => {
    try{
        const postData = await postSchema.findOne({_id:req.params.post_id})
        const userData = await userSchema.find({_id:{$in:postData.proposals}})
        res.json({status:true,postData:postData,userData:userData})
    }catch(err){
        console.log(err)
    }
}

export default {postJob, searchResult, completedPost, searchSuggestion, deletePost, getPostData, getSinglePost, saveJobs, sendProposal, getMyPost, changePostStatus, getMyProposals, getLatest, getSaved, bestMatch, removeSaved, getClientPost, setRejectedProposal, setAcceptedProposal, updateJob}