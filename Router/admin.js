import express from "express"
import adminController from "../Controller/adminController.js"
const router = express.Router()

router.post("/login",adminController.Login)

export default router