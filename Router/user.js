import express from "express"
const router = express.Router()
import UserController from "../Controller/UserController.js"
import { upload, uploadAudio } from "../Middleware/Multer.js"

router.post("/signup",UserController.signup)
router.post("/login",UserController.Login)
router.post("/auth",UserController.auth)
router.post("/getUserData",UserController.getUserData)
router.post("/update-profile-pic",upload.single("image"),UserController.updatePic)
router.post("/update-profile-audio",uploadAudio.single("audio"),UserController.updateAudio)
router.post("/changeProfileData",UserController.updateProfile)

export default router