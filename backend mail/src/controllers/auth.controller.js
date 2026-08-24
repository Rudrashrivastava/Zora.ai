import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js";
import {sendEmail }from "../services/email.service.js";


export async function register(req,res){

    const {username , email , password} =req.body;

    const isUser = await userModel.findOne({
        $or:[
            {username},{email}
        ]
    })

    if(isUser){
        return res.status(400).json({
            message:`user Already exists with this  ${isUser.username === username ? username :email}`
        })
    }


    const user = await userModel.create({
        username:username,
        email:email,
        password:password
    })

    const emailVerifyToken = jwt.sign({
        email:user.email
    },
    process.env.JWT_SECRET,
    {expiresIn:"3d"}
)

    await sendEmail({ 
    to: email,
    subject: "Welcome to Perplexity 🚀",
    html: `
    <div style="font-family: Arial, sans-serif; background:#0f172a; padding:30px;">
    <div style="max-width:600px; margin:auto; background:#1e293b; padding:25px; border-radius:12px; color:white;">
        
        <h2 style="color:#38bdf8;">Welcome, ${username}! 🚀</h2>

        <p>
        Your journey with <strong>Perplexity</strong> has just begun!
        </p>
        <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerifyToken}"><button>VERIFY EMAIL</button></a>
         
        <p>
        Ask anything, explore knowledge instantly, and boost your productivity.
        </p>

        <div style="margin:20px 0; padding:15px; background:#0f172a; border-radius:8px;">
        ✨ Ask questions<br/>
        ⚡ Get instant answers<br/>
        📚 Learn faster
        </div>

        <p>If you need any help, just reply to this email.</p>

        <p style="margin-top:25px;">
        — Team Perplexity 💙
        </p>

    </div>
    </div>
    `
});
}


export async function verifyEmail(req,res){


}

