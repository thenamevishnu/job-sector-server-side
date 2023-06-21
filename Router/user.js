import express from "express"
const router = express.Router()
import UserController from "../Controller/UserController.js"

router.post("/signup",UserController.signup)
router.post("/login",UserController.Login)
router.post("/auth",UserController.auth)

export default router