import express from "express"
const router = express.Router()
import UserController from "../Controller/UserController.js"
import { upload, uploadAudio, uploadPdf } from "../Middleware/Multer.js"
import postController from "../Controller/postController.js"
import chatController from "../Controller/chatController.js"
import { headerToken } from "../Middleware/Auth.js"

router.post("/signup",UserController.signup)
router.post("/login",UserController.Login)
router.post("/auth",UserController.auth)
router.post("/getUserData",headerToken,UserController.getUserData)
router.get("/getUserDataByEmail/:email",UserController.getUserDataByEmail)
router.post("/update-profile-pic",headerToken,upload.single("image"),UserController.updatePic)
router.post("/update-client-profile-pic",headerToken,upload.single("image"),UserController.updateClientPic)
router.post("/update-profile-audio",headerToken,uploadAudio.single("audio"),UserController.updateAudio)
router.post("/update-profile-pdf",headerToken,uploadPdf.single("pdf"),UserController.updatePdf)
router.post("/changeProfileData",headerToken,UserController.updateProfile)
router.post("/resetPassword/:email",UserController.resetPassword)

router.post("/post-job",headerToken,postController.postJob)
router.post("/update-job",headerToken,postController.updateJob)

router.get("/getPostData",headerToken,postController.getPostData)
router.get("/get-single-post/:id",headerToken,postController.getSinglePost)

router.post("/saveJobs",headerToken,postController.saveJobs)
router.post("/sendProposal",headerToken,postController.sendProposal)

router.post("/chats",headerToken,chatController.chat)
router.get("/getChatList/:user_id",headerToken,chatController.getChatList)
router.get("/getMyPost/:id",headerToken,postController.getMyPost)
router.post("/delete-post",headerToken,postController.deletePost)
router.post("/completed-post",headerToken,postController.completedPost)

router.post("/changePostStatus/:id/:user_id/:status",headerToken,postController.changePostStatus)
router.get("/getMyProposals/:id",headerToken,postController.getMyProposals)

router.get("/getLatest",headerToken,postController.getLatest)
router.get("/bestMatch/:id",headerToken,postController.bestMatch)
router.get("/getSavedPost/:id",headerToken,postController.getSaved)

router.post("/removeSaved/:user_id/:post_id",headerToken,postController.removeSaved)

router.get("/client-post-view/:post_id",headerToken,postController.getClientPost)
router.post("/reject-proposals",headerToken,postController.setRejectedProposal)
router.post("/accept-proposals",headerToken,postController.setAcceptedProposal)

router.get("/getAllUsersSkills",headerToken,UserController.getAllUsersSkills)
router.post("/addConnection",headerToken,UserController.addConnection)

router.post("/addPaymentMethod",headerToken,UserController.addPaymentMethod)
router.post("/onPaymentCompleted",headerToken,UserController.onPaymentCompleted)

router.get("/getSearchResult/:query",headerToken,postController.searchSuggestion)
router.post("/search",headerToken,postController.searchResult)

router.post("/postNotification",headerToken,UserController.postNotification)
router.post("/deleteAccount",headerToken,UserController.deleteAccount)

router.get("/getUserReports/:user_id",headerToken,UserController.getUserReports)
router.get("/getClientReport/:user_id",headerToken,UserController.getClientReport)

router.post("/changeTwoStep",headerToken,UserController.changeTwoStep)

router.post("/withdraw",headerToken,UserController.withdraw)
router.post("/changePassword",headerToken,UserController.changePassword)
router.post("/rateUser",headerToken,UserController.rateUser)

router.post("/contact",headerToken,UserController.contact)

export default router