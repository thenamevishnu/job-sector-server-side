import { adminSchema } from "../Model/AdminModel.js"
import jwt from "jsonwebtoken"
import { userSchema } from "../Model/userModel.js"
import mongoose from "mongoose"
import { postSchema } from "../Model/postModel.js";
import { sendBroadcast } from "../Mail.js";

function isRegexValid(regexPattern) {
    try {
      new RegExp(regexPattern);
      return true;
    } catch (e) {
      return false;
    }
  }

const Login = async (req, res, next) => {
    try{
        const obj = {}
        const {adminData} = req.body
        const regex = {
            email : /^([\w])([\w\W])+@([a-zA-Z0-9]){3,6}.([a-zA-Z0-9]){2,3}$/gm,
            password : /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!@#$%^&*().\\?]).{8,16}$/gm
        }
        if(!regex.email.test(adminData.email)){
            obj.status = false
            obj.message = "invalid email format!"
        }else if(!regex.password.test(adminData.password)){
            obj.status = false
            obj.message = "Invalid password!"
        }else{
            const exist = await adminSchema.findOne({email:adminData.email,password:adminData.password})
            if(!exist){
                obj.status = false
                obj.message = "Invalid login credentials!"
            }else{
                obj.status = true
                obj.message = "Redirecting..."
                const maxAge = 60 * 60 * 24 * 3 // 3 days
                const token = jwt.sign({ sub : exist._id } , process.env.jwt_key_admin, {expiresIn:maxAge*1000})
                obj.loggedIn = true
                obj.token = token
                obj.getAdmin = exist
                }
            }
        res.json(obj)
    }catch(err){
        res.json({error:err.message})
    }
}

const auth = async (req, res, next) => {
    try{
        const {adminStorage} = req.body
        const obj = {}
        const response = adminStorage ? JSON.parse(adminStorage) : null
        if(response){
            const auth = jwt.verify(response.token,process.env.jwt_key_admin)
            const now = Math.floor(new Date().getTime() / 1000)
            if(auth.exp <= now){
                obj.status = false
            }else{
                obj.status = true
            }
        }
        res.json(obj)
    }catch(err){
        res.json({error:err.message})
    }
}

const getAllUsers = async (req, res, next) => {
    try{
        const userData = await userSchema.aggregate([
            {
                $addFields:{
                    name:"$profile.full_name",
                    title:"$profile.title",
                    level:"$profile.experienceLevel",
                    type:"$profile.account_type",
                    verified:"$profile.is_verified"
                },
            },{
                $project:{
                    _id:1,
                    name:1,
                    title:1,
                    level:1,
                    my_proposals:1,
                    type:1,
                    spent:1,
                    balance:1,
                    banned:1,
                    verified:1
                }
            }
        ])
    res.json({status:true,response:userData})
    }catch(err){
        res.json({error:err.message})
    }
}

const updateBanStatus = async (req, res, next) => {
    try{
        const body = req.body
        await userSchema.updateOne({_id:new mongoose.Types.ObjectId(body._id)},{$set:{banned:!body.banned}})
        const userData = await userSchema.aggregate([
            {
                $addFields:{
                    name:"$profile.full_name",
                    title:"$profile.title",
                    level:"$profile.experienceLevel",
                    type:"$profile.account_type",
                    verified:"$profile.is_verified"
                },
            },{
                $project:{
                    _id:1,
                    name:1,
                    title:1,
                    level:1,
                    my_proposals:1,
                    type:1,
                    spent:1,
                    balance:1,
                    banned:1,
                    verified:1
                }
            }
        ])
        res.json({status:true,response:userData}) 
    }catch(err){
        res.json({error:err.message})
    }
}

const updateTickStatus = async (req, res, next) => {
    try{
        const body = req.body
        await userSchema.updateOne({_id:new mongoose.Types.ObjectId(body._id)},{$set:{"profile.is_verified":!body.verified}})
        const userData = await userSchema.aggregate([
            {
                $addFields:{
                    name:"$profile.full_name",
                    title:"$profile.title",
                    level:"$profile.experienceLevel",
                    type:"$profile.account_type",
                    verified:"$profile.is_verified"
                },
            },{
                $project:{
                    _id:1,
                    name:1,
                    title:1,
                    level:1,
                    my_proposals:1,
                    type:1,
                    spent:1,
                    balance:1,
                    banned:1,
                    verified:1
                }
            }
        ])
        res.json({status:true,response:userData}) 
    }catch(err){
        res.json({error:err.message})
    }
}

const fetchSearchData = async (req, res, next) =>{
    try{
        if(!isRegexValid(req.params.key)){
            return
        }
        const key = new RegExp(""+req.params.key+"","i")
        const userData = await userSchema.aggregate([
            {
                $addFields:{
                    name:"$profile.full_name",
                    title:"$profile.title",
                    level:"$profile.experienceLevel",
                    type:"$profile.account_type",
                    verified:"$profile.is_verified"
                },
            },{
                $match:{
                    $or:[{
                        name:{
                            $regex:key
                        }
                    },{
                        level:{
                            $regex:key
                        }
                    },{
                        title:{
                            $regex:key
                        }
                    },{
                        type:{
                            $regex:key
                        }
                    },{
                        balance:{
                            $regex:key
                        }
                    },{
                        spent:{
                            $regex:key
                        }
                    }]
                }
            },{
                $project:{
                    _id:1,
                    name:1,
                    title:1,
                    level:1,
                    my_proposals:1,
                    type:1,
                    spent:1,
                    balance:1,
                    banned:1,
                    verified:1
                }
            }
        ])
        res.json({status:true,response:userData}) 
    }catch(err){
        res.json({error:err.message})
    }
}

const getAllPost = async (req, res, next) =>{
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
                            "profile.full_name":1,
                            "profile.username":1,
                            "profile.is_verified":1
                        }
                    }],
                    as:"auther"
                }
            }
        ])
        res.json({status:true,response:postData})
    }catch(err){
        res.json({error:err.message})
    }
}

const fetchSearchPostData = async (req, res, next) => {
    try{
        if(!isRegexValid(req.params.key)){
            return
        }
        const key = new RegExp(""+req.params.key+"","i")
        const postData = await postSchema.aggregate([
            {
                $lookup:{
                    from:"users",
                    localField:"user_id",
                    foreignField:"_id",
                    pipeline:[{
                        $project:{
                            _id:1,
                            "profile.full_name":1,
                            "profile.username":1,
                            "profile.is_verified":1
                        }
                    }],
                    as:"auther"
                }
            },{
                $match:{
                    $or:[{
                        title:{
                            $regex:key
                        }
                    },{
                        experience:{
                            $regex:key
                        }
                    },{
                        "auther.0.profile.full_name":{
                            $regex:key
                        }
                    },{
                        "auther.0.profile.username":{
                            $regex:key
                        }
                    }]
                }
            },
        ])
        res.json({status:true,response:postData})
    }catch(err){
        res.json({error:err.message})
    }
}

const getAdminData = async (req, res, next) => {
    try{
        const response = await adminSchema.findOne({_id:req.params.user_id})
        res.json({status:true,response:response.payouts})
    }catch(err){
        res.json({error:err.message})
    }
}

const payoutManageAdmin = async (req, res, next) => {
    try{
        const {items, type, admin_id} = req.body
        const response = await adminSchema.findOne({_id:admin_id})
        if(type){
            response.payouts.splice(response.payouts.indexOf(items),1)
            items.status = "Paid"
            response.payouts.push(items)
            await adminSchema.updateMany({},{$set:{payouts:response.payouts}})
            const userData = await userSchema.findOne({_id:new mongoose.Types.ObjectId(items.user_id)})
            const last = userData.transactions.pop()
            last.status = "Paid"
            userData.transactions.push(last)
            await userSchema.updateOne({_id:new mongoose.Types.ObjectId(items.user_id)},{$set:{transactions:userData.transactions}})
            const data = await adminSchema.findOne({_id:admin_id})
            res.json({status:true,response:data.payouts})
        }else{
            response.payouts.splice(response.payouts.indexOf(items),1)
            items.status = "Rejected"
            response.payouts.push(items)
            await adminSchema.updateMany({},{$set:{payouts:response.payouts}})
            const userData = await userSchema.findOne({_id:new mongoose.Types.ObjectId(items.user_id)})
            const last = userData.transactions.pop()
            last.status = "Rejected"
            userData.transactions.push(last)
            await userSchema.updateOne({_id:new mongoose.Types.ObjectId(items.user_id)},{$set:{transactions:userData.transactions},$inc:{balance:100}})
            const data = await adminSchema.findOne({_id:admin_id})
            res.json({status:false,response:data.payouts})
        }
    }catch(err){
        res.json({error:err.message})
    }
}

const getDashboard = async (req, res, next) => {
    try{
        const obj = {}
        const userData = await userSchema.find()
        const postData = await postSchema.find()
        const adminData = await adminSchema.findOne({_id:new mongoose.Types.ObjectId(req.params.id)})
        obj.TotalUsers = userData.length
        obj.Experts = userData.reduce((count, user)=>count + (user.profile.experience === "Experts" ? 1 : 0) , 0)
        obj.Intermediate = userData.reduce((count, user)=>count + (user.profile.experience === "Intermediate" ? 1 : 0) , 0)
        obj.Entry = userData.reduce((count, user)=>count + (user.profile.experience === "Entry Level" ? 1 : 0) , 0)
        obj.Verified = userData.reduce((count, user)=>count + (user.profile.is_verified ? 1 : 0) , 0)
        obj.TotalPosts = postData.length
        obj.Completed = postData.reduce((count, post)=>count + (post.completed ? 1 : 0) , 0)
        obj.NotCompleted = postData.reduce((count, post)=>count + (post.completed ? 0 : 1) , 0)
        obj.Enabled = postData.reduce((count, post)=>count + (post.status ? 1 : 0) , 0)
        obj.Disabled = postData.reduce((count, post)=>count + (post.status ? 0 : 1) , 0)
        obj.ClientSpent = userData.reduce((spent, user) => spent + (user.profile.account_type === "client" ? user.spent : 0), 0)
        obj.FreelancerBalance = userData.reduce((spent, user) => spent + (user.profile.account_type === "freelancer" ? user.balance : 0) ,0)
        obj.Clients = userData.reduce((count, user) => count + (user.profile.account_type === "client" ? 1 : 0), 0)
        obj.Freelancers = userData.reduce((count, user) => count + (user.profile.account_type === "freelancer" ? 1 : 0), 0)
        obj.Profit = adminData.profit ?? 0
        
        const sumByMonth = adminData.profitData.reduce((result, obj) => {
            const { amount, month: month } = obj;
            
            if (!result[month]) {
                result[month] = 0;
            }
            
            result[month] += amount;
            return result;
            }, {});

        obj.profitData = sumByMonth ? Object.entries(sumByMonth).map(([month,amount]) => ({month,amount})) : [0]
        res.json(obj)
    }catch(err){
        res.json({error:err.message})
    }
}

const sendNotification = async (req, res, next) => {
    try{
        const {type, message} = req.body
        const subject = type == "promotional" ? "Promotional Message" : type == "broadcast" ? "Broadcast Message" : "Account Related"
        const findUsers = await userSchema.find()
        findUsers.forEach(async (user) => {
            if(user.notifications){
                await sendBroadcast(user.profile.email, subject, message)
            }
        })
    }catch(err){
        res.json({error:err.message})
    }
}

export default { Login, auth, getDashboard, sendNotification, getAllUsers,payoutManageAdmin, getAdminData, updateBanStatus, fetchSearchData, updateTickStatus,getAllPost, fetchSearchPostData }