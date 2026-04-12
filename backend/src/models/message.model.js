
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({

  chat:{
    ref:'chat',
    type:mongoose.Schema.Types.ObjectId,
    Types:ObjectId,
    required:[true,"chat history or ID is requied"]
  },

  content:{
    type:String,
    required:[true],
    trim :true
  },


  role:{
    type:String,
    enum :["AI", "User"],
    required:[true]
  }

},

    {timestamps:true}
)

const messageModel = mongoose.model("messages",MessageSchema)
