import { userSchema } from "../Model/userModel.js"; 
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { uploadCloud } from "../Middleware/Cloudinary.js";
import { resetLink, sendBroadcast, sendMail } from "../Mail.js";
import mongoose from "mongoose";
import { postSchema } from "../Model/postModel.js";
import { adminSchema } from "../Model/AdminModel.js";

const signup = async (req, res, next) => {
    try{
        const obj = {}
        let {userData} = req.body
        console.log(userData);
        const result = await userSchema.findOne({"profile.email":userData.email})
        if(result){
            obj.status = false
            obj.message = "Email already exist!"
        }else{
            const response = await userSchema.findOne({"profile.username":userData.username})
            if(response){
                obj.status = false
                obj.message = "Username already exist!"
            }else{
                if(!userData.signup_method){
                    if(!userData.otp && !req.session?.otp){
                        const response = await sendMail(userData.email)
                        if(response.status){
                            obj.message = "Otp sent to "+userData.email
                            obj.status = "sent"
                            obj.otp = response.otp
                            req.session.otp = response.otp
                        }else{
                            obj.status="error"
                            obj.message="Error happend!"
                        }
                    }else{
                        console.log(userData.otp, req.session.otp)
                        if(isNaN(userData.otp) || parseInt(userData.otp) !== req.session.otp){
                            obj.status = "invalid"
                            obj.message = "Invalid otp!"
                        }else{
                            const json = {
                                profile:userData
                            }
                            json.profile.password = await bcrypt.hash(json?.profile?.password,10)
                            await userSchema.insertMany([json])
                            obj.status = true
                            obj.message = "Registration Successful!"   
                        }
                        
                    }
                }else{
                    const json = {
                        profile:userData
                    }
                    json.profile.password = await bcrypt.hash(json?.profile?.password,10)
                    await userSchema.insertMany([json])
                    obj.status = true
                    obj.message = "Registration Successful!"   
                }
            } 
        }
        res.json(obj)
    }catch(err){
        console.log(err);
    }
}

const deleteAccount = async (req, res, next) => {
    try{
        const {id, email, password} = req.body
        const obj = {}
        const exist = await userSchema.findOne({_id:id,"profile.email":email})
        if(!exist){
            obj.status = false
            obj.message = "Something went wrong!"
        }else{
            const passwordCheck = await bcrypt.compare(password, exist.profile.password)
            if(!passwordCheck){
                obj.status = false
                obj.message = "Invalid password!"
            }else{
                await userSchema.deleteOne({_id:id,"profile.email":email})
                await postSchema.updateMany({},{$pull:{proposals:new mongoose.Types.ObjectId(id)}})
                obj.status = true
                obj.message = "Account Deleted"
            }
        }
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const Login = async (req, res, next) => {
    try{
        const obj = {}
        const {userData} = req.body
        const regex = {
            email : /^([\w])([\w\W])+@([a-zA-Z0-9]){3,6}.([a-zA-Z0-9]){2,3}$/gm,
            password : /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!@#$%^&*().\\?]).{8,16}$/gm
        }
        if(!regex.email.test(userData.email)){
            obj.status = false
            obj.message = "invalid email format!"
        }else if(!regex.password.test(userData.password)){
            obj.status = false
            obj.message = "Invalid password!"
        }else{
            const exist = await userSchema.findOne({"profile.email":userData.email})
            if(!exist){
                obj.status = false
                obj.message = "Invalid login credentials!"
            }else{
                const passCheck = await bcrypt.compare(userData.password , exist.profile.password)
                if(!passCheck){
                    obj.status = false
                    obj.message = "Invalid login credentials!"
                }else{
                    obj.status = true
                    obj.message = "Redirecting..."
                    const maxAge = 60 * 60 * 24 * 3 // 3 days
                    const token = jwt.sign({ sub : exist._id } , process.env.jwt_key_admin , {expiresIn:maxAge*1000})
                    obj.loggedIn = true
                    obj.token = token
                    obj.getUser = exist
                }
            }
        }
        res.json(obj)
    }catch(err){
        console.log(err);
    }
}

const auth = async (req, res, next) => {
    try{
        const {userStorage} = req.body
        const obj = {}
        const response = userStorage ? JSON.parse(userStorage) : null
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
        obj.status = false
        res.json(obj)
    }
}

const getUserData = async (req, res, next) => {
    try{
        const response = await userSchema.findOne({_id:new mongoose.Types.ObjectId(req.body.id)})
        res.json(response)
    }catch(err){
        console.log(err)
    }
}

const getUserDataByEmail = async (req, res, next) => {
    try{
        const obj = {}
        const response = await userSchema.findOne({"profile.email":req.params.email})
        if(!response){
            obj.status = false
            obj.message = "No User Found!"
        }else{
            if(response.signup_method == "google"){
                obj.status = false
                obj.message = "You can login with google!"
            }else{
                const response = await resetLink(req.params.email)
                if(!response.status){
                    obj.status = false
                    obj.message = "Failed to send an email!"
                }else{
                    obj.status = true
                    obj.message = "Check your email for reset link!"
                    obj.key = response.key
                }
            }
            
        }
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const resetPassword = async (req, res, next) => {
    try{
        const password = req.body
        const email = req.params.email
        const obj = {}
        const checkPass = await userSchema.findOne({"profile.email":email})
        console.log(checkPass);
        if(checkPass){
            const pass = await bcrypt.compare(password.newPassword, checkPass.profile.password)
            console.log(pass);
            if(pass){
                obj.status = false
                obj.message = "Password is same as your old password!"
            }else{
                password.newPassword = await bcrypt.hash(password.newPassword,10)
                await userSchema.updateOne({"profile.email":email},{$set:{"profile.password":password.newPassword}})
                obj.status = true
                obj.message = "Password reset successful!"
            }
        }
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const updatePic = async (req, res, next) => {
    try{
        const {user_id} = req.body
        const imgUrl=req.file.filename
        const dp = await uploadCloud(imgUrl,1)
        await userSchema.updateOne({_id:user_id},{$set:{"profile.image":dp}})
        res.json({status:true,dp:dp})
    }catch(err){
        console.log(err)
    }
}

const updateAudio = async (req, res, next) => {
    try{
        const {user_id} = req.body
        const audioUrl=req.file.filename
        const audio = await uploadCloud(audioUrl,2)
        await userSchema.updateOne({_id:user_id},{$set:{"profile.audio":audio+".mp3"}})
        res.json({status:true,audio:audio+".mp3"})
    }catch(err){
        console.log(err)
    }
}

const updatePdf = async (req, res, next) => {
    try{
        const {user_id} = req.body
        const pdfUrl=req.file.filename
        const pdf = await uploadCloud(pdfUrl,3)
        await userSchema.updateOne({_id:user_id},{$set:{"profile.pdf":pdf+".pdf"}})
        res.json({status:true,pdf:pdf+".pdf"})
    }catch(err){
        console.log(err)
    }
}

const getAllUsersSkills = async (req, res, next) => {
    try{
        const userData = await userSchema.aggregate([
            {
                $project:{
                    _id:0,
                    "profile.skills":1
                }
            },{
                $unwind:"$profile.skills"
            },{
                $group:{
                    _id:null,
                    uniqueArray:{
                        $addToSet:"$profile.skills"
                    }
                }
            }
        ])
        const skills = userData?.length > 0 ? userData[0]?.uniqueArray : null
        res.json({status:true,skills:skills})
    }catch(err){    
        console.log(err)
    }
}

const addConnection = async (req, res, next) => {
    try{
        const {follower,to} = req.body
        const obj = {}
        const connections = await userSchema.findOne({_id:new mongoose.Types.ObjectId(follower),"profile.connections.my_connections":{$in:[new mongoose.Types.ObjectId(to)]}})
        if(connections){
            obj.status = false
            obj.message = "Already connected!"
        }else{
            const connections = await userSchema.findOne({_id:new mongoose.Types.ObjectId(to),"profile.connections.ids":{$in:[new mongoose.Types.ObjectId(follower)]}})
            if(connections){
                obj.status = false
                obj.message = "Already connected!"
            }else{
                await userSchema.updateOne({_id:new mongoose.Types.ObjectId(follower)},{$push:{"profile.connections.my_connections":new mongoose.Types.ObjectId(to)}})
                await userSchema.updateOne({_id:new mongoose.Types.ObjectId(to)},{$push:{"profile.connections.ids":new mongoose.Types.ObjectId(follower)},$inc:{"profile.connections.count":1}})
                obj.status = true
                obj.message = "Connection successful!"
            }
        }
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const updateProfile = async (req, res, next) => {
    try{
        const body = req.body
        if(body?.hoursPerWeek){
            await userSchema.updateOne({_id:body.id},{$set:{"profile.hoursPerWeek":body.hoursPerWeek}})
        }
        if(body?.language){
            const language = await userSchema.findOne({_id:body.id,"profile.language.lang":body.language.lang})
            if(language){
                res.json({status:false,message:"Language already exist!"})
            }else{
                await userSchema.updateOne({_id:body.id},{$push:{"profile.language":body.language}})
                const languages = await userSchema.findOne({_id:body.id})
                res.json({status:true,languages:languages.profile.language})
            }  
        }
        if(body?.education){
            const regexp = new RegExp(""+body.education.name+"","i")
            const education = await userSchema.findOne({_id:body.id,"profile.education.name":{$regex:regexp}})
            if(education){
                res.json({status:false,message:"College/School already exist!"})
            }else{
                await userSchema.updateOne({_id:body.id},{$push:{"profile.education":body.education}})
                const educations = await userSchema.findOne({_id:body.id})
                res.json({status:true,educations:educations.profile.education})
            }  
        }
        if(body?.bio){
            await userSchema.updateOne({_id:body.id},{$set:{"profile.title":body.bio.title,"profile.per_hour":body.bio.per_hour,"profile.description":body.bio.description}})
            const bio = await userSchema.findOne({_id:body.id})
            res.json({status:true,bio:bio.profile}) 
        }
        if(body?.skill){
            const regexp = new RegExp(""+body.skill.skills+"","i")
            const skill = await userSchema.findOne({_id:body.id,"profile.skills":{$regex:regexp}})
            if(skill){
                res.json({status:false,message:"Skill is exist!"})
            }else{
                await userSchema.updateOne({_id:body.id},{$push:{"profile.skills":body.skill.skills}})
                const skills = await userSchema.findOne({_id:body.id})
                console.log(skills);
                res.json({status:true,skills:skills.profile.skills})
            }  
        }
        if(body?.project){
            const regexp = new RegExp(""+body.project.url+"","i")
            const project = await userSchema.findOne({_id:body.id,"profile.my_projects.url":{$regex:regexp}})
            if(project){
                res.json({status:false,message:"Project is exist!"})
            }else{
                await userSchema.updateOne({_id:body.id},{$push:{"profile.my_projects":body.project}})
                const projects = await userSchema.findOne({_id:body.id})
                res.json({status:true,projects:projects.profile.my_projects})
            }  
        }
        if(body?.employment){
            const regexp1 = new RegExp(""+body.employment.company+"","i")
            const regexp2 = new RegExp(""+body.employment.title+"","i")
            const employment = await userSchema.findOne({_id:body.id,"profile.employment_history.company":{$regex:regexp1},"profile.employment_history.title":{$regex:regexp2}})
            if(employment){
                res.json({status:false,message:"Company and title is exist!"})
            }else{
                await userSchema.updateOne({_id:body.id},{$push:{"profile.employment_history":body.employment}})
                const employments = await userSchema.findOne({_id:body.id})
                res.json({status:true,employments:employments.profile.employment_history})
            }  
        }
        if(body?.certificate){
            const regexp1 = new RegExp(""+body.certificate.provider+"","i")
            const regexp2 = new RegExp(""+body.certificate.title+"","i")
            const regexp3 = new RegExp(""+body.certificate.link+"","i")
            const certificate = await userSchema.findOne({_id:body.id,"profile.certificates.provider":{$regex:regexp1},"profile.certificates.title":{$regex:regexp2},"profile.certificates.link":{$regex:regexp3}})
            if(certificate){
                res.json({status:false,message:"Certificate is exist!"})
            }else{
                await userSchema.updateOne({_id:body.id},{$push:{"profile.certificates":body.certificate}})
                const certificates = await userSchema.findOne({_id:body.id})
                res.json({status:true,certificates:certificates.profile.certificates})
            }  
        }
        if(body?.deleteLanguage){
            await userSchema.updateOne({_id:body.id},{$pull:{"profile.language":body.obj}})
            const languages = await userSchema.findOne({_id:body.id})
            res.json({status:true,languages:languages.profile.language})
        }
        if(body?.deleteEducation){
            await userSchema.updateOne({_id:body.id},{$pull:{"profile.education":body.obj}})
            const educations = await userSchema.findOne({_id:body.id})
            res.json({status:true,educations:educations.profile.education})
        }
        if(body?.deleteSkill){
            await userSchema.updateOne({_id:body.id},{$pull:{"profile.skills":body.value}})
            const skills = await userSchema.findOne({_id:body.id})
            res.json({status:true,skills:skills.profile.skills})
        }
        if(body?.deleteProject){
            await userSchema.updateOne({_id:body.id},{$pull:{"profile.my_projects":body.obj}})
            const projects = await userSchema.findOne({_id:body.id})
            res.json({status:true,projects:projects.profile.my_projects})
        }
        if(body?.deleteEmployment){
            await userSchema.updateOne({_id:body.id},{$pull:{"profile.employment_history":body.obj}})
            const employments = await userSchema.findOne({_id:body.id})
            res.json({status:true,employments:employments.profile.employment_history})
        }
        if(body?.deleteCertificate){
            await userSchema.updateOne({_id:body.id},{$pull:{"profile.certificates":body.obj}})
            const certificates = await userSchema.findOne({_id:body.id})
            res.json({status:true,certificates:certificates.profile.certificates})
        }
        if(body?.checkStatus){
            console.log(body);
            await userSchema.updateOne({_id:body.id},{$set:{"profile.available":body.value}})
        }
    }catch(err){
        console.log(err);
    }
}   

const addPaymentMethod = async (req, res, next) => {
    try{
        const obj = req.body
        await userSchema.updateOne({_id:new mongoose.Types.ObjectId(obj.user_id)},{$set:{[`withdrawal_methods.${obj.method}`]:{to:obj.to}}})
        res.json({status:true})
    }catch(err){
        console.log(err)
    }
}

const onPaymentCompleted = async (req, res, next) => {
    try{
        const {pay_id, amount,currency,user_id} = req.body
        await userSchema.updateOne({_id:new mongoose.Types.ObjectId(user_id)},{$inc:{balance:amount},$push:{transactions:{to:null,amount:amount,currency:currency,pay_id:pay_id,time:new Date()}}})
        const transactions = await userSchema.findOne({_id:user_id})
        res.json({status:true,transactions:transactions.transactions})
    }catch(err){
        console.log(err)
    }
}

const postNotification = async (req, res, next) => {
    try{
        const {id, obj} = req.body
        await userSchema.updateOne({_id:new mongoose.Types.ObjectId(id)},{$set:{notifications:obj}})
    }catch(err){
        console.log(err)
    }
}

const getUserReports = async (req, res, next) => {
    try{
        const userReport = await userSchema.aggregate([
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(req.params.user_id)
                }
            },{
                $project:{
                    _id:null,
                    work_history:{
                        $size:"$profile.work_history"
                    },
                    saved_jobs:{
                        $size:"$saved_jobs"
                    },
                    rejected_jobs:{
                        $size:"$rejected_jobs"
                    },
                    project_cost:1,
                    spent:1,
                    balance:1,
                    proposals:{
                        $size:"$my_proposals"
                    },
                    pending_proposals:{
                        $size:{
                            $filter:{
                                input:"$my_proposals",
                                as:"element",
                                cond:{
                                    $eq:["$$element.status","Pending"]
                                }
                            }
                        }
                    },
                    achieved_proposals:{
                        $size:{
                            $filter:{
                                input:"$my_proposals",
                                as:"element",
                                cond:{
                                    $eq:["$$element.status","Achieved"]
                                }
                            }
                        }
                    },
                    completed_proposals:{
                        $size:{
                            $filter:{
                                input:"$my_proposals",
                                as:"element",
                                cond:{
                                    $eq:["$$element.status","Completed"]
                                }
                            }
                        }
                    }
                }
            }
        ])
        
        const sumByMonth = userReport[0]?.project_cost?.reduce((result, obj) => {
        const { amount, month: month } = obj;
        
        if (!result[month]) {
            result[month] = 0;
        }
        
        result[month] += amount;
        return result;
        }, {});
        userReport[0].project_cost = sumByMonth ? Object.entries(sumByMonth).map(([month,cost]) => ({month,cost})) : [0]
        res.json({status:true,reports:userReport})
    }catch(err){
        console.log(err)
    }
}

const getClientReport = async (req, res, next) => {
    try{
        const posts = await postSchema.aggregate([
            {
                $match:{
                    user_id:new mongoose.Types.ObjectId(req.params.user_id)
                }
            }
        ])
        const user = await userSchema.aggregate([
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(req.params.user_id)
                }
            },{
                $project:{
                    _id:0,
                    spent:1,
                    project_cost:1
                }
            }
        ])
        const obj = {}
        obj.total_post = posts ? posts.length : 0
        const enabled = posts.filter(obj => obj.status === true)
        console.log(enabled);
        obj.enabled = enabled ? enabled.length : 0
        const disabled = posts.filter(obj => obj.status === false)
        obj.disabled = disabled ? disabled.length : 0
        const completed = posts.filter(obj => obj.completed === true)
        obj.completed = completed ? completed.length : 0

        const sumByMonth = user[0]?.project_cost?.reduce((result, obj) => {
        const { amount, month: month } = obj;
        
        if (!result[month]) {
            result[month] = 0;
        }
        
        result[month] += amount;
        return result;
        }, {});
        user[0].project_cost = sumByMonth ? Object.entries(sumByMonth).map(([month,cost]) => ({month,cost})) : [0]
        obj.spent = user ? user[0]?.spent : 0
        obj.project_cost = user ? user[0]?.project_cost : [0]
        res.json({status:true,reports:obj})    
    }catch(err){
        console.log(err)
    }
}

const changeTwoStep = async (req, res, next) => {
    try{
        const {id, status} = req.body
        console.log(req.body);
        await userSchema.updateOne({_id:new mongoose.Types.ObjectId(id)},{$set:{twoStep:status}})
        res.json({status:true})
    }catch(err){
        console.log(err)
    }
}

const withdraw = async (req, res, next) => {
    try{
        const {id,to} = req.body
        const times = new Date()
        const timeNow = Math.floor(times.getTime()/1000)
        const obj  = {
            amount : 100,
            status : "Pending",
            currency : "USD",
            time : times,
        }
        await userSchema.updateOne({_id:new mongoose.Types.ObjectId(id)},{$push:{transactions:obj},$set:{cooldown:timeNow + 86400},$inc:{balance:-100}})
        obj.user_id = id
        obj.to = to
        await adminSchema.updateMany({},{$push:{payouts:obj}})
        res.json({status:true,cooldown:timeNow+86400})
    }catch(err){
        console.log(err)
    }
}

const changePassword = async (req, res, next) => {
    try{
        const {user_id, password} = req.body
        const obj = {}
        const userData = await userSchema.findOne({_id:user_id})
        const passwordCheck = await bcrypt.compare(password.oldPassword, userData.profile.password)
        if(!passwordCheck){
            obj.status = false
            obj.message = "Invalid current password!"
        }else{
            const passwordCheck = await bcrypt.compare(password.newPassword, userData.profile.password)
            if(passwordCheck){
                obj.status = false
                obj.message = "New password same as current!"
            }else{
                const hash = await bcrypt.hash(password.newPassword,10)
                await userSchema.updateOne({_id:new mongoose.Types.ObjectId(user_id)},{$set:{"profile.password":hash}});
                obj.status = true
                obj.message = "Password Updated!"
            }
        }
        res.json(obj)
    }catch(err){
        console.log(err)
    }
}

const contact = async (req, res, next) => {
    try{
        const {email, id, name, subject, message} = req.body.userData
        console.log(req.body);
        const text = `Name: ${name}<br>UserID: ${id}<br>Email: ${email}<br><br>message: ${message}`
        await sendBroadcast(process.env.email, subject, text)
    }catch(err){
        console.log(err)
    }
}

export default {onPaymentCompleted, contact, changePassword, updatePdf, withdraw, changeTwoStep, getClientReport, postNotification, getUserReports, deleteAccount, signup,Login,auth,addPaymentMethod,addConnection,getUserData,updatePic,updateAudio,updateProfile,getUserDataByEmail,resetPassword, getAllUsersSkills}