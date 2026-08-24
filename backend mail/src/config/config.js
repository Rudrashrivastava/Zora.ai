import dotenv from "dotenv";


dotenv.config();


const config = {
    clientId:process.env.GOOGLE_CLIENT_ID,
    user: process.env.GOOGLE_USER,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
}