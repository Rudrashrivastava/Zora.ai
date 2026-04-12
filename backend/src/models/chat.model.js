import mongoose from "mongoose";


const chatSchema =  new mongoose.Schema({


    title:{
         type:String,
         default:"NEW CHAT",
         trim:true
    },

    user:{
        ref:'user',
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },


},{
    timestamps:true
})