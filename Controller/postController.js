import { adminSchema } from "../Model/AdminModel.js"
import { postSchema } from "../Model/postModel.js"
import { userSchema } from "../Model/userModel.js"
import {prefix} from "../Trie/Trie.js"
import mongoose from "mongoose"

const postJob = async (req, res, next) => {
    try{
        const {postData} = req.body
        postData.posted = new Date().getTime()
        const data = await postSchema.insertMany([postData])
        res.json({status:true})
    }catch(err){
        res.json({error:err.message})
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
        prefix.UploadArray(newArray)
        const response = prefix.searchResponse(prefixWord)
        res.json({status:true,response:response})
    }catch(err){
        res.json({error:err.message})
    }
}

const updateJob = async (req, res, next) => {
    try{
        const {postData} = req.body
        const {post_id,user_id,...rest} = postData
        const data = await postSchema.updateOne({_id:new mongoose.Types.ObjectId(postData.post_id)},{$set:rest})
        res.json({status:true})
    }catch(err){
        res.json({error:err.message})
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
                            "profile.avgRating":1,
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
        res.json({error:err.message})
    }
}

const searchResult = async (req, res, next) => {
    try{
        const search = req.body.search
        const filters = req.body.filterData ?? {}
        const experience = filters?.experience == "" ? null : filters?.experience
        const proposals = filters?.proposals == "" ? null : filters?.proposals?.toString()
        const connections = filters?.connections == "" ? null : filters?.connections?.toString()
        const jobType = filters?.jobType == "" ? null : filters?.jobType
        const sort = filters?.sort == "" ? null : filters?.sort
        let matchObj = {
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
        if(proposals!=null){
            let [start, end] = proposals.split(" - ")
            start = parseInt(start)
            end = parseInt(end)
            matchObj = {
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
                ],
                $expr:{
                    $and:[
                        {
                            $gte:[{$size:"$proposals"},start]
                        },{
                            $lte:[{$size:"$proposals"},end]
                        }
                    ]
                }
            }
        } 
        if(connections!=null){
            let [start, end] = connections.split(" - ")
            matchObj.connectionsNeedfrom = parseInt(start)
            matchObj.connectionsNeedto = parseInt(end)
        } 
        if(experience!=null) matchObj.experience = {$in:experience?.split(",")} 
        if(jobType!=null) matchObj.jobType = {$in:jobType?.split(",")}
        if(experience!=null) matchObj.experience = {$in:experience?.split(",")} 
        let sorting = {
            $sort:{
                posted: -1
            }
        }
        if(sort != null){
            if(sort == "latest"){
                sorting = {
                    $sort:{
                        posted:-1
                    }
                }
            }
            if(sort == "oldest"){
                sorting = {
                    $sort:{
                        posted:1
                    }
                }
            }
            if(sort == "proposalsLow"){
                sorting = {
                    $sort:{
                        proposalSize: 1
                    }
                }
            }
            if(sort == "proposalsHigh"){
                sorting = {
                    $sort:{
                        proposalSize: -1
                    }
                }
            }
            if(sort == "connectionsLow"){
                sorting = {
                    $sort:{
                        connectionsNeedfrom: 1
                    }
                }
            }
            if(sort == "connectionsHigh"){
                sorting = {
                    $sort:{
                        connectionsNeedfrom: -1
                    }
                }
            }
        }
        const postData = await postSchema.aggregate([{
                $addFields:{
                    proposalSize:{
                        $size:"$proposals"
                    }
                }
            },
            {
                $match:matchObj
            },{
                $lookup:{
                    from:"users",
                    localField:"user_id",
                    foreignField:"_id",
                    pipeline:[{
                        $project:{
                            _id:1,
                            "profile.avgRating":1,
                            spent:1,
                            "profile.country":1,
                            "profile.image":1,
                            "profile.is_verified":1
                        }
                    }],
                    as:"auther"
                }
            },sorting
        ])
        
        res.json({status:true,response:postData})
    }catch(err){
        res.json({error:err.message})
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
                            "profile.avgRating":1,
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
        res.json({error:err.message})
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
                            "profile.avgRating":1,
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
        res.json({error:err.message})
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
                            "profile.avgRating":1,
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
                            "profile.avgRating":1,
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
        res.json({error:err.message})
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
        res.json({error:err.message})
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
        res.json({error:err.message})
    }
}

const setAcceptedProposal = async (req, res, next) => {
    try{
        const obj = {}
        const {post_id,user_id} = req.body
        const available = await userSchema.findOne({_id:user_id})
        if(!available.profile.available){
            obj.status = false
            obj.message = "User is not available!"
        }else{
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
        }
        const postData = await postSchema.findOne({_id:post_id})
        const userData = await userSchema.find({_id:{$in:postData.proposals}})
        obj.userData = userData
        res.json(obj)
    }catch(err){
        res.json({error:err.message})
    }
}

const sendProposal = async (req, res, next) => {
    try{
        const obj = {}
        const {post_id,user_id} = req.body
        const userData = await userSchema.findOne({_id:user_id})
        const postData = await postSchema.findOne({_id:post_id})
        const response = await userSchema.findOne({_id:user_id,rejected_jobs:new mongoose.Types.ObjectId(post_id)})
        const levels = {
            "Entry Level":["Entry Level"],
            "Intermediate":["Enter Level","Intermediate"],
            "Expert":["Entry Level","Intermediate","Expert"]
        }
        if(!(levels[userData.profile.experience].includes(postData.experience))){
            obj.status = false
            obj.message = "You need level: "+postData.experience+""
        }else{
            if(response){
                obj.status = false
                obj.message = "Can't send, because you're rejected before!"
            }else{
                if(userData?.profile?.connections?.count < postData?.connectionsNeedfrom){
                    obj.status = false
                    obj.warn = "warn"
                    obj.message = `Need atleast ${postData?.connectionsNeedfrom} connections!`
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
        }
        const info = await postSchema.findOne({_id:post_id})
        obj.response = info?.proposals
        res.json(obj)
    }catch(err){
        res.json({error:err.message})
    }
}

const getMyPost = async (req, res, next) => {
    try{
        const user_id = req.params.id
        const allPosts = await postSchema.find({user_id:user_id})
        res.json({posts:allPosts})
    }catch(err){
        res.json({error:err.message})
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
        res.json({error:err.message})
    }
}

const changePostStatus = async (req, res, next) => {
    try{
        await postSchema.updateOne({_id:req.params.id},{$set:{status:req.params.status}})
        const postData = await postSchema.find({user_id:req.params.user_id})
        res.json({status:true,postData:postData})
    }catch(err) {
        res.json({error:err.message})
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
        res.json({error:err.message})
    }
}

const completedPost = async (req, res, next) => {
    try{
        const {post_id,user_id,amount} = req.body
        const post_info = await postSchema.findOne({_id:post_id})
        const obj = {}
        if(!post_info.selected){
            obj.status = false
            obj.message = "Project is not achieved by anyone!"
        }else{
            if(amount < post_info.priceRangefrom || amount > post_info.priceRangeto){
                obj.status = false
                obj.message = `Amount should be $${post_info.priceRangefrom}-$${post_info.priceRangeto}`
            }else{
                const clientData = await userSchema.findOne({_id:user_id})
                if(clientData.balance < amount){
                    obj.status = false
                    obj.message = `You have only $${clientData.balance}`
                }else{
                    const amt = amount - ( amount * 0.02 )
                    const spent = {}
                    spent.amount = amt
                    spent.month = new Date().toLocaleString("default",{month:"long"})
                    await userSchema.updateOne({_id:new mongoose.Types.ObjectId(post_info.selected)},{$inc:{balance:amt},$push:{project_cost:spent}})
                    await userSchema.updateOne({_id:new mongoose.Types.ObjectId(user_id)},{$inc:{balance:-amt,spent:amt},$push:{project_cost:spent}})
                    await adminSchema.updateMany({},{$inc:{profit:amount*0.02},$push:{profitData:{amount:amount*0.02,month:new Date().toLocaleString("default",{month:"long"})}}})
                    await postSchema.updateOne({_id:post_id},{$set:{completed:1,status:0}})
                    const allPosts = await postSchema.find({user_id:user_id})
                    obj.postData = allPosts
                    obj.status = true
                    obj.messsage = "Updated!"
                }
            }
        }
        res.json(obj)
    }catch(err) {
        res.json({error:err.message})
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
                            "profile.avgRating":1,
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
        res.json({error:err.message})
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
                            "profile.avgRating":1,
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
        res.json({error:err.message})
    }
}

const getClientPost = async (req, res, next) => {
    try{
        const postData = await postSchema.findOne({_id:req.params.post_id})
        const userData = await userSchema.find({_id:{$in:postData.proposals}})
        res.json({status:true,postData:postData,userData:userData})
    }catch(err){
        res.json({error:err.message})
    }
}

export default {postJob, searchResult, completedPost, searchSuggestion, deletePost, getPostData, getSinglePost, saveJobs, sendProposal, getMyPost, changePostStatus, getMyProposals, getLatest, getSaved, bestMatch, removeSaved, getClientPost, setRejectedProposal, setAcceptedProposal, updateJob}