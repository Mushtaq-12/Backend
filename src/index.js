// require("dotenv").config({path:"./env"})


import connectDB from "./db/db.config.js";
import dotenv from "dotenv";
import { app } from "./app.js";


connectDB()
.then(()=>{
    const Port=process.env.PORT || 4000
    
    app.on('error',(error)=>{
        console.log("Error:",error)
    })
    
    app.listen(Port,()=>{
        console.log(`Server Listening on the port:${Port}`)
    })

})
.catch((error)=>
{
    console.log("Server connection error!!",error)
})



 