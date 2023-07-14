import express from "express"
import chatController from "../Controller/chatController.js"
const router = express.Router()

router.post("/send-message",chatController.sendMessage)
router.get("/get-all-messages/:chat_id",chatController.getAllMessages)

export default router