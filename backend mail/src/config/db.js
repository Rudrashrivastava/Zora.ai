import dotenv from "dotenv"
import mongoose, { connect }  from "mongoose";
dotenv.config();
export async function connectToDb(){
    await mongoose.connect(process.env.MONGO_URI).then(()=>{
        console.log("connect to Db.......");
        
    }).catch((e)=>{
        console.log("error",e);
        
    })
}