import { userSchema } from "../Model/userModel.js"; 
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { uploadCloud } from "../Middleware/Cloudinary.js";
import { resetLink, sendMail } from "../Mail.js";
import mongoose from "mongoose";

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
                    const token = jwt.sign({ sub : exist._id } , process.env.jwt_key , {expiresIn:maxAge*1000})
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

const getUserData = async (req, res, next) => {
    try{
        const response = await userSchema.findOne({_id:req.body.id})
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
        res.json({status:true,transactions:transactions})
    }catch(err){
        console.log(err)
    }
}

export default {onPaymentCompleted, signup,Login,auth,addPaymentMethod,addConnection,getUserData,updatePic,updateAudio,updateProfile,getUserDataByEmail,resetPassword, getAllUsersSkills}