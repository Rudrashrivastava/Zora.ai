import  nodemailer from 'nodemailer';
import dotenv from "dotenv"
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.GOOGLE_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        // accessToken:process.env.GOOGLE_ACCESS_TOKEN
    
    },
});

// Verify the connection configuration
    transporter.verify().
    then(()=>{
        console.log("well");
        
    })
    .catch((err)=>{
        console.log("error",err);
        
    });


export async function sendEmail ({to , subject , text , html}){
    const mailOption = {
           from: process.env.GOOGLE_USER, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            html, // html body
    }

    const details = await transporter.sendMail(mailOption);
    console.log("EMAIL SENT SUCCESSFULY...",details);
    
       
}
