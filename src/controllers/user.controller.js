import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

export const generateAccessAndRefreshToken=async(userId)=>{
    try {
        const user= await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})
     
    return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"something went wrong")
    }
}

export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { fullName, email, username, password } = req.body;

  // validation -not empty
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fields are Mandatory");
  }
  // check if user already exists :username,email
  const existedUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists!");
  }
  // check for images,avatar
  const avatarLocalPath = req.files?.avatar[0]?.path; 
  // const coverImageLocalPath=req.files?.coverImage[0]?.path

  let coverImageLocalPath;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  // upload them to cloudinary,avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }
  // create user object - create entry in db
  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
  });
  // remove password and refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // check for user creation
  if (!createdUser) {
    throw new ApiError(500, "some thing went wrong while registering user");
  }
  // return res
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully..."));
});

export const loginUser=asyncHandler(async (req,res) => {
    //take email,password from body
    const {email,username,password}=req.body;
    //check fields should not be empty
    if(!email || !username){
        throw new ApiError(400,"email or username is required")
    }
    //find user
    const user=await User.findOne({$or:[{email},{username}]})

    if(!user){
        throw new ApiError(404,"User doesnot exists!")
    }
    //compare the password 
    const isPasswordValid=await user.isPasswordCorrect(password)
     if(!isPasswordValid){
        throw new ApiError(401,"Incorrect password")
    }
    //generate the access token an drefersh token
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
    
    //send cookies
    const loggeduser=await User.findById(user._id).select("-password -refreshToken")
    
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("AccessToken",accessToken,options)
    .cookie("RefreshToken",refreshToken,options)
    .json(new ApiResponse(200,{user:loggeduser,accessToken,refreshToken},"User login Successfully!"))
})

export const logoutUser=asyncHandler(async (req,res) => {
    const user=await User.findByIdAndUpdate(req.user._id,{$set:{
    refreshToken:undefined
    }},{new:true})

    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("AccessToken",options)
    .clearCookie("RefreshToken",options)
    .json(new ApiResponse(200,{},"User Logged out Successfully"))
})

export const refershAccessToken=asyncHandler(async (req,res) => {
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Access")
    }
    try{
        const decodedToken=jwt.verify(incomingRefreshToken,REFRESH_TOKEN_SECRET)

        const user =await User.findById(decodedToken?._id)
        if(!user){
        throw new ApiError(401,"Invalid Refresh token")
    }
    if(incomingRefreshToken!==user?.refreshToken){
        throw ApiError(401,"Refresh token is invalid")
    }
    const {accessToken,newrefreshToken}=generateAccessAndRefreshToken(user._id)
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("AccessToken",accessToken,options)
    .cookie("RefreshToken",newrefreshToken,options)
    .json(new ApiResponse(200,{accessToken,refreshToken:newrefreshToken}),"Access token refreshed")
    }catch(error){
        throw new ApiError(401,error?.message || "invalid refresh token")
    }
})

export const changePassword=asyncHandler(async (req,res) => {
    const {oldPassword,newpassword}=req.body
    const user= await User.findById(req.user._id)
    const passwordValidation=await user.isPasswordCorrect(oldPassword)

    if(!passwordValidation){
        throw new ApiError(400,"Invalid old password")
    }

    user.password=newpassword
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,{},"Password changed Successfully!"))
})

 
export const getCurrentUser=asyncHandler(async(req,res)=>{

    return res.status(200).json(new ApiResponse(200,req.user,"current user fetched"))
})



export const updateAccountDetails=asyncHandler(async (req,res) => {
    const {fullName,email}=req.body

    if(!fullName ||!email){
        throw new ApiError(400,"All fields are required")
    }
    const user= await User.findByIdAndUpdate(req.user?._id,
    {
    $set:{
        email:email,
        fullName    //both types we can pass
        }
    },
    {new:true}
    ).select("-password")

    if(!user){
        throw new ApiError(404,"User not found")
    }
    else{
        return res.status(200).json(new ApiResponse(200,user,"Updated Successfully"))
    }
})


export const updateAvatarFile=asyncHandler(async(req,res)=>{

    const avatarfilePath= await req.file?.path

    if(avatarfilePath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinary(avatarfilePath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading file")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{$set:{avatar:avatar.url}},{new:true})
    return res.status(200).json(new ApiResponse(200,user,"Uploaded Successfully"))
})

export const uploadCoverImage=asyncHandler(async (req,res) => {

    const coverFilePath=req.file?.path

    if(!coverFilePath){
        throw new ApiError(400,"coverImage path is missing")
    }
    const coverImage= await uploadOnCloudinary(coverFilePath)

    if(!coverImage){
        throw new ApiError(400,"Falied to upload")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{$set:{coverImage}},{new:true})
    
    return res.status(200).json(new ApiResponse(200,user,"CoverImage is uploaded Successfully"))
     
})

export const getAccountDetails=asyncHandler(async (req,res) => {

    const {username}=req.params;

    if(!username?.trim()){
        throw new ApiError(400,"Username is empty")
    }
    const channel=await User.aggregate([
        {
            $match:{username:username}    //its matches that user is present in the database or not
        },
        {
            $lookup:{                       //it gives the no of subscribers to the channel
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{                        //it give the no of channel that user / you got subscribed
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{                     //it adds the subscribers count of a channel
                subscribersCount:{    
                    $size:"$subscribers"   //size is used to count the no of document
                },
                channelsSubscribedToCount:{ //it used to show how many channel did we got subscribed
                    $size:"$subscribedTo"
                },
                isSubscribed:{    //this we wrote that does the user is subscribed the channel or not
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{   //it is used to send what type of data or display to be send as response
                fullName:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    console.log(channel)
    if(!channel?.length){
        throw new ApiError(404,"Channel doesnot exists")
    }
    return res.status(200).json(new ApiResponse(200,channel[0],"Channel Details fetched Successfully"))
})



