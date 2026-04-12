import app from "./src/app.js"
import { connectToDb } from "./src/config/db.js";


app.listen(3000, ()=>{
    connectToDb();
    console.log("server is running on port 3000");
    
})