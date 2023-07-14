import { adminSchema } from "../Model/AdminModel.js"
import jwt from "jsonwebtoken"

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

export default { Login }