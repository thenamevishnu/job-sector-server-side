import express from "express"
import chatController from "../Controller/chatController.js"
import { headerToken } from "../Middleware/Auth.js"
const router = express.Router()

router.post("/send-message",headerToken,chatController.sendMessage)
router.get("/get-all-messages/:chat_id",headerToken,chatController.getAllMessages)
router.post("/unreadMessage",headerToken,chatController.unreadMessage)

export default router