import { Router } from "express";
import { changePassword, getAccountDetails, getCurrentUser, loginUser, logoutUser, refershAccessToken, registerUser, updateAccountDetails, updateAvatarFile, uploadCoverImage } from "../controllers/user.controller.js";
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

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("Avatar"),updateAvatarFile);

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),uploadCoverImage)

router.route("/channnel/:username").get(verifyJWT,getAccountDetails)

// router.route("/watch-history").get(verifyJWT,getWatchHistory)
export default router