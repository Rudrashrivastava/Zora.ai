import express from "express"
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}))

app.get('/',(req,res)=>{
    res.send("HOME")
})


app.use("/api/auth",authRouter);

export default app;