import jwt from "jsonwebtoken"

export const headerToken = async (req, res, next) => {
    try{
        const token = req.headers["authorization"]
        const obj = {}
        if(token?.split(" ")[1] == null){
            obj.status = false
            obj.message = "Authorization Faild!"
        }else{
            const auth = jwt.verify(token?.split(" ")[1],process.env.jwt_key)
            const now = Math.floor(new Date().getTime() / 1000)
            if(auth.exp <= now){
                obj.status = false
                obj.message = "Authorization Faild!"
            }else{
                next()
            }
        }
    }catch(err){
        res.json({error:err.message})
    }
}

export const adminAuth = async (req, res, next) => {
    try{
        const token = req.headers["authorization"]
        const obj = {}
        if(token?.split(" ")[1] == null){
            obj.status = false
            obj.message = "Authorization Faild!"
        }else{
            const auth = jwt.verify(token?.split(" ")[1],process.env.jwt_key_admin)
            const now = Math.floor(new Date().getTime() / 1000)
            if(auth.exp <= now){
                obj.status = false
                obj.message = "Authorization Faild!"
            }else{
                obj.status = true
                next()
            }
        }
    }catch(err){
        res.json({error:err.message})
    }
}

