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
    const path = num===1 ? "../Server/Temp/ProfilePics/"+image : "../Server/Temp/Audios/"+image
    const obj = num===1 ? {public_id:uuid} : {resource_type: "raw",public_id:uuid}
    await cloudinary.v2.uploader.upload(path,obj,(err,result)=>{
        fs.unlink("../Server/Temp/Audios/"+image,(err, response)=>{})
    })
    return uuid
}