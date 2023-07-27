import { adminSchema } from "../Model/AdminModel.js"
import jwt from "jsonwebtoken"
import { userSchema } from "../Model/userModel.js"
import mongoose from "mongoose"
import { postSchema } from "../Model/postModel.js";

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
                const token = jwt.sign({ sub : exist._id } , process.env.jwt_key , {expiresIn:maxAge*1000})
                obj.loggedIn = true
                obj.token = token
                obj.getAdmin = exist
                }
            }
        res.json(obj)
    }catch(err){
        console.log(err);
    }
}

const auth = async (req, res, next) => {
    try{
        const {adminStorage} = req.body
        const obj = {}
        const response = adminStorage ? JSON.parse(adminStorage) : null
        if(response){
            const auth = jwt.verify(response.token,process.env.jwt_key)
            const now = Math.floor(new Date().getTime() / 1000)
            if(auth.exp <= now){
                obj.status = false
            }else{
                obj.status = true
            }
        }
        res.json(obj)
    }catch(err){
        console.log(err);
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
        console.log(err)
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
        console.log(err)
    }
}

const updateTickStatus = async (req, res, next) => {
    try{
        const body = req.body
        console.log(body);
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
        console.log(err)
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
        console.log(err)
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
        console.log(err)
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
        console.log(err)
    }
}

const getAdminData = async (req, res, next) => {
    try{
        const response = await adminSchema.findOne({_id:req.params.user_id})
        res.json({status:true,response:response.payouts})
    }catch(err){
        console.log(err)
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
        console.log(err)
    }
}

export default { Login, auth, getAllUsers,payoutManageAdmin, getAdminData, updateBanStatus, fetchSearchData, updateTickStatus,getAllPost, fetchSearchPostData }