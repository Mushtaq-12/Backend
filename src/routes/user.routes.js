import { Router } from "express";
import { changePassword, getCurrentUser, loginUser, logoutUser, refershAccessToken, registerUser } from "../controllers/user.controller.js";
import {upload} from"../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/oauth.middleware.js";
const router=Router()

router.route("/register").post(upload.fields([
{
    name:"avatar",maxCount:1
},
{
    name:"coverImage",maxCount:1
}
]),registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refershAccessToken)

router.route("/change-password").post(verifyJWT,changePassword)

router.route("/current-user").get(getCurrentUser)

// router.
export default router