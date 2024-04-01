import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (user_id) => {
    try {
        const user = await User.findById(user_id);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        const updatedData = await user.save({ validateBeforeSave: false })
        updatedData.refreshToken = undefined;
        updatedData.password = undefined;
        return { accessToken, refreshToken, updatedData }
    } catch (error) {
        throw new Error(`Error while generating access/refresh token`)
    }
}


const registerUser = asyncHandler(async (req, res) => {

    //  -----------------------------  ALGORTITHM FOR REGISTARTION --------------------------------

    // register user
    // get data from the body
    // validation
    // check if the user is already registered in db
    // upload image to server and the on cloudinary server and get the url
    // create the data to be saved to db
    // register the user
    // send data back to user without password and refresh token fields





    const { email, fullName, password, userName } = req.body;

    // if (email == '' || fullName == '' || userName == '' || password == '') {
    //     console.log('entered', '-hdjd')
    //     throw new ApiError(400, "All fields are required")
    // }

    if ([email, fullName, password, userName].some((item) => item == undefined || item?.trim() == '')) {
        throw new ApiError(400, "Fields are empty/missing")
    }
    if (!email.includes('@')) {
        throw new ApiError(400, "Incorrect Email")
    }

    // check if the user is already in the data-base
    const existingUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (existingUser) {
        throw new ApiError(409, "User with email/userName already in the data-base")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path

    let coverImageLocalPath;
    if (req.files && req.files.coverImage && Array.isArray(req.files.coverImage)) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log(avatarLocalPath)
    console.log(coverImageLocalPath, '-path-')

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }
    const cloudinaryAvatar = await uploadOnCloudinary(avatarLocalPath);

    const cloudinaryCoverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.log(cloudinaryAvatar, '--url')

    if (!cloudinaryAvatar) {
        throw new ApiError(400, "Avatar file is required")
    }


    const user = await User.create({
        fullName,
        userName,
        email,
        password,
        avatar: cloudinaryAvatar.url,
        coverImage: cloudinaryCoverImage?.url || "",
    })
    console.log(user, '--user is here---')
    const createdUser = await User.findById(user._id).select(
        "-passoword -refreshToken"
    )
    console.log(createdUser, '-=created USer----')
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating/registering the user")
    }

    res.status(201).json(new ApiResponse(200, createdUser, "User Registered Successfully", true))

})


const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    // validation of fields
    // check if the user exists
    // check if the password is correct
    // generate AccessToken and refreshToken 
    // save refreshToken in db
    // store AccessToken in the cookies and also send in response data
    if ([email, password].some((item) => item == undefined || item?.trim() == '')) {
        throw new ApiError(400, "email/password missing")
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(400, "User does not exists");
    }
    const checkPassword = await user.isPasswordCorrect(password);
    if (!checkPassword) {
        throw new ApiError(401, "Invalic credentials");
    }

    const { accessToken, refreshToken, updatedData } = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }
    res.status(200).
        cookie("accessToken", accessToken, options).
        cookie("refreshToken", refreshToken, options).
        json(new ApiResponse(200, { user: updatedData, refreshToken, accessToken }, "user logged in successfully", true))

})


const logoutUser = asyncHandler(async (req, res) => {
    const { email } = req.body;
    console.log(email, '-email')
    const user = await User.findOne({ email });
    // console.log(user, '-user found');
    if (!user) {
        throw new Error("User not found")
    }
    // user.refreshToken = undefined  
    // const updatedval = await User.findByIdAndUpdate(user._id,
    //     {
    //         $set: {
    //             refreshToken: undefined
    //         }
    //     },
    //     {
    //         new: true
    //     }
    // )


    // to remove a field , use unset

    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { $unset: { refreshToken: "" } }, // Use $unset to remove the refreshToken field
        { new: true } // Return the modified document
    );

    console.log(updatedUser, '-updated Val=-');

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "user logged out successfully", true))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
        // console.log(req.cookies.refreshToken, '-cookie')
        if (!incommingRefreshToken) {
            throw new ApiError(401, `Invalid request`)
        }
        const verifyToken = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        // console.log(verifyToken, '-verified token')
        if (!verifyToken) {
            throw new ApiError(401, `Invalid refresh token`)
        }

        const checkUser = await User.findById(verifyToken._id);
        console.log(checkUser, '-user--')

        // match the refresh token
        if (checkUser.refreshToken != incommingRefreshToken) {
            throw new ApiError(401, `Refresh tokem invalid/expired`)
        }

        // generate new tokens;
        const { accessToken, refreshToken, updatedData } = await generateAccessAndRefreshToken(checkUser._id);
        const options = {
            httpOnly: true,
            secure: true,
        }
        res.status(200).
            cookie("accessToken", accessToken, options).
            cookie("refreshToken", refreshToken, options).
            json(new ApiResponse(200, { accessToken, refreshToken }, "access token refreshed successfully", true))
    } catch (error) {
        throw new ApiError(error.message)
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }