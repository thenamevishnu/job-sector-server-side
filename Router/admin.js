import express from "express"
import adminController from "../Controller/adminController.js"
const router = express.Router()

router.post("/login",adminController.Login)
router.post("/auth",adminController.auth)
router.get("/getAllUsers",adminController.getAllUsers)
router.post("/updateBanStatus",adminController.updateBanStatus)
router.post("/updateTickStatus",adminController.updateTickStatus)
router.get("/fetchSearchData/:key",adminController.fetchSearchData)
router.get("/fetchSearchPostData/:key",adminController.fetchSearchPostData)
router.get("/getAllPost",adminController.getAllPost)
router.get("/getAdminData/:user_id",adminController.getAdminData)
router.post("/payoutManageAdmin",adminController.payoutManageAdmin)
router.get("/getDashboard/:id",adminController.getDashboard)

export default router