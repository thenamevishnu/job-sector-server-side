import multer from "multer"
import path from "path"
import {fileURLToPath} from "url"

const moduleURL = new URL(import.meta.url);
const filePath = fileURLToPath(moduleURL);
const directoryPath = path.dirname(filePath);

const storage = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, path.join(directoryPath,"/../Temp/ProfilePics"))
    },
    filename:function(req,file,cb){
        cb(null,Date.now()+'-'+file.originalname)
    }
})

const storage2 = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, path.join(directoryPath,"/../Temp/Audios"))
    },
    filename:function(req,file,cb){
        cb(null,Date.now()+'-'+file.originalname)
    }
})

const storage3 = multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, path.join(directoryPath,"/../Temp/Pdfs"))
    },
    filename:function(req,file,cb){
        cb(null,Date.now()+'-'+file.originalname)
    }
})

export const upload = multer({storage:storage})
export const uploadAudio = multer({storage:storage2})
export const uploadPdf = multer({storage:storage3})