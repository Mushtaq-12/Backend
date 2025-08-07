import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,  //it is used for whicg users are you allowing to communicate from frontend
    credentials:true
}))


app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))

app.use(express.static("public"))  //used to store the local files ,public represents folder named in that files uesd to store
app.use(cookieParser())

// importing routes
import userRoutes from "./routes/user.routes.js"

//creating routes
app.use("/api/users",userRoutes);









export {app}