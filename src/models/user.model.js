import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const userSchema = new Schema({
    username:{
        type:String,
        required:[true,"Required the username"],
        unique:true,
        trim:true,
        lowercase:true,
        index:true  //in database we can able to search username in database easily
    },
    email:{
        type:String,
        required:[true,"Required the email"],
        unique:true,
        trim:true,
        lowercase:true,
    },
    fullname:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    avatar:{
        type:String,  //cloudnairy url,
        required:true
    },
    coverImage:{
        type:String
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,"Password is required"]
    },
    refressToken:{
        type:String
    }

},{timestamps:true})

userSchema.pre("Save",async function (next) {
    if(this.isModified("password")){
        this.password=bcrypt.hash(this.password,10)
        next()
    }
    else{
        next()
    }  
})

//to valiadte the users password is correct or not

userSchema.methods.isPasswordCorrect=async function (password) {
    const result=await bcrypt.compare(password,this.password)
    return result    
}

//GENERATE ACCESS TOKEN

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
        _id:this._id,
        email:this.email,
        username:this.username,
        fullname:this.fullname 
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

//GENERATE REFRESH TOKEN

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign({
        _id:this._id,

    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
)
}

export const User=mongoose.model("User",userSchema)