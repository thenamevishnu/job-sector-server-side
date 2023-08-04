import nodemailer from "nodemailer"
import dotenv from "dotenv"
import sha256 from "sha256"

dotenv.config()

export const sendMail = async (email,subject="Email verification") => {
    
    return new Promise(resolve => {
        const obj = {}

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            user: process.env.email,
            pass: process.env.emailPassword
            }
        });

        const otp = Math.floor(1000 + Math.random() * 9000)
        
        const mailOptions = {
            from: process.env.email,
            to: email,
            subject: subject,
            html: `Otp is ${otp}`
        };

        
        
        transporter.sendMail(mailOptions, function(error, info){
          
            if (error) {
                obj.status = false
                resolve(obj)
            } else {
                obj.status = true
                obj.otp = otp
                resolve(obj)
            }
        })
    })
}

export const resetLink = async (email) => {
    
    return new Promise(resolve => {
        const obj = {}

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            user: process.env.email,
            pass: process.env.emailPassword
            }
        });

        const key = sha256(""+new Date().getTime()+"")
        
        const mailOptions = {
            from: process.env.email,
            to: email,
            subject: "Reset Password",
            html: `<b>This link is valid for 5 minutes : <a href="http://localhost:3000/reset/${key}">Reset</a></b>`
        };

        
        
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                obj.status = false
                resolve(obj)
            } else {
                obj.status = true
                obj.key = key
                resolve(obj)
            }
        })
    })
}

export const sendBroadcast = async (email,subject,message) => {
    
    return new Promise(resolve => {
        const obj = {}

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            user: process.env.email,
            pass: process.env.emailPassword
            }
        });
        
        const mailOptions = {
            from: process.env.email,
            to: email,
            subject: `${subject}`,
            html: `${message}`
        };

        
        
        transporter.sendMail(mailOptions, function(error, info){
          
            if (error) {
                obj.status = false
                resolve(obj)
            } else {
                obj.status = true
                obj.otp = otp
                resolve(obj)
            }
        })
    })
}