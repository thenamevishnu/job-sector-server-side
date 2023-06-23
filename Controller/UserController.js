import { userSchema } from "../Model/userModel.js"; 
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { uploadCloud } from "../Middleware/Cloudinary.js";

const signup = async (req, res, next) => {
    try{
        const obj = {}
        let {userData} = req.body
        console.log(userData);
        const regex = {
            full_name : /^([\w\WA-Za-z])([\w\WA-Za-z\s]){3,11}$/gm,
            username : /^([_a-z])([a-z0-9]){3,11}$/gm,
            email : /^([\w\W])([\w\W])+@([a-zA-Z0-9]){3,6}.([a-zA-Z0-9]){2,3}$/gm,
            password : /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!@#$%^&*().\\?]).{8,16}$/gm
       }
        if(!regex.full_name.test(userData.full_name)){
            obj.status = false
            obj.message = "invalid first name!"
        }else if(!regex.username.test(userData.username)){
            obj.status = false
            obj.message = "Invalid last name!"
        }else if(!regex.email.test(userData.email)){
            obj.status = false
            obj.message = "Invalid email format!"
        }else if(!regex.password.test(userData.password)){
            obj.status = false
            obj.message = "Invalid password!"
        }else{
            const result = await userSchema.findOne({"profile.email":userData.email})
            if(result){
                obj.status = false
                obj.message = "Email already exist!"
            }else{
                const response = await userSchema.findOne({"profile.username":userData.email})
                if(response){
                    obj.status = false
                    obj.message = "Username already exist!"
                }else{
                    const json = {
                            profile:userData
                        }
                    json.profile.password = await bcrypt.hash(json.profile.password,10)
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
        console.log(response);
        res.json(response)
    }catch(err){
        console.log(err)
    }
}

const updatePic = async (req, res, next) => {
    try{
        const {user_id} = req.body
        const imgUrl=req.file.filename
        const dp = await uploadCloud(imgUrl,1)
        console.log(dp);
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

const updateProfile = async (req, res, next) => {
    try{
        const body = req.body
        if(body?.hoursPerWeek){
            await userSchema.updateOne({_id:body.id},{$set:{"profile.hoursPerWeek":body.hoursPerWeek}})
        }
    }catch(err){
        console.log(err);
    }
}   

export default {signup,Login,auth,getUserData,updatePic,updateAudio,updateProfile}