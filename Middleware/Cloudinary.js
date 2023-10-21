import fs from 'fs'
import cloudinary from "cloudinary"
import dotenv from "dotenv"
import sha256 from "sha256"

dotenv.config()

cloudinary.config({ 
    cloud_name: process.env.cloudinary_name,
    api_key: process.env.cloudinary_key, 
    api_secret: process.env.cloudinary_secret
});

export const uploadCloud = async (image,num) => {
    const uuid = sha256(image)
    const path = num===1 ? "./Temp/ProfilePics/"+image+"" : num===2 ? "./Temp/Audios/"+image+"" : "./Temp/Pdfs/"+image+""
    const obj = num===1 ? {public_id:uuid} : num===2 ? {resource_type: "raw",public_id:uuid} : {resource_type: "raw",public_id:uuid}
    await cloudinary.v2.uploader.upload(path,obj,(err,result)=>{
        num === 1 ? fs.unlink("./Temp/ProfilePics/"+image+"",(err, response)=>{}) :
        num === 2 ? fs.unlink("./Temp/Audios/"+image+"",(err, response)=>{}) : 
        fs.unlink("./Temp/Pdfs/"+image+"",(err, response)=>{})
    })
    return uuid
}