import express from "express"
const router = express.Router()
import UserController from "../Controller/UserController.js"
import { upload, uploadAudio } from "../Middleware/Multer.js"
import postController from "../Controller/postController.js"
import chatController from "../Controller/chatController.js"

router.post("/signup",UserController.signup)
router.post("/login",UserController.Login)
router.post("/auth",UserController.auth)
router.post("/getUserData",UserController.getUserData)
router.get("/getUserDataByEmail/:email",UserController.getUserDataByEmail)
router.post("/update-profile-pic",upload.single("image"),UserController.updatePic)
router.post("/update-profile-audio",uploadAudio.single("audio"),UserController.updateAudio)
router.post("/changeProfileData",UserController.updateProfile)
router.post("/resetPassword/:email",UserController.resetPassword)

router.post("/post-job",postController.postJob)
router.post("/update-job",postController.updateJob)

router.get("/getPostData",postController.getPostData)
router.get("/get-single-post/:id",postController.getSinglePost)

router.post("/saveJobs",postController.saveJobs)
router.post("/sendProposal",postController.sendProposal)

router.post("/chats",chatController.chat)
router.get("/getChatList/:user_id",chatController.getChatList)
router.get("/getMyPost/:id",postController.getMyPost)
router.post("/delete-post",postController.deletePost)
router.post("/completed-post",postController.completedPost)

router.post("/changePostStatus/:id/:user_id/:status",postController.changePostStatus)
router.get("/getMyProposals/:id",postController.getMyProposals)

router.get("/getLatest",postController.getLatest)
router.get("/bestMatch/:id",postController.bestMatch)
router.get("/getSavedPost/:id",postController.getSaved)

router.post("/removeSaved/:user_id/:post_id",postController.removeSaved)

router.get("/client-post-view/:post_id",postController.getClientPost)
router.post("/reject-proposals",postController.setRejectedProposal)
router.post("/accept-proposals",postController.setAcceptedProposal)

router.get("/getAllUsersSkills",UserController.getAllUsersSkills)
router.post("/addConnection",UserController.addConnection)

router.post("/addPaymentMethod",UserController.addPaymentMethod)
router.post("/onPaymentCompleted",UserController.onPaymentCompleted)

// router.get("/searchSuggestion",postController.searchSuggestion)
export default router