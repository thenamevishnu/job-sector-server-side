import express from "express"
import adminController from "../Controller/adminController.js"
import { adminAuth } from "../Middleware/Auth.js"
const router = express.Router()

router.post("/login",adminController.Login)
router.post("/auth",adminController.auth)
router.get("/getAllUsers",adminAuth,adminController.getAllUsers)
router.post("/updateBanStatus",adminAuth,adminController.updateBanStatus)
router.post("/updateTickStatus",adminAuth,adminController.updateTickStatus)
router.get("/fetchSearchData/:key",adminAuth,adminController.fetchSearchData)
router.get("/fetchSearchPostData/:key",adminAuth,adminController.fetchSearchPostData)
router.get("/getAllPost",adminAuth,adminController.getAllPost)
router.get("/getAdminData/:user_id",adminAuth,adminController.getAdminData)
router.post("/payoutManageAdmin",adminAuth,adminController.payoutManageAdmin)
router.get("/getDashboard/:id",adminAuth,adminController.getDashboard)
router.post("/sendNotification",adminAuth,adminController.sendNotification)

export default router