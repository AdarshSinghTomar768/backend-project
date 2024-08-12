import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponce.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (user) => {
    
    try{
        const user = await User.findById(_id);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;  
        await user.save({
            validateBeforeSave: false});   //saved to db

        return { accessToken, refreshToken };
    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating access and refresh token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // res.status(200).json({ message: "ok" })


    //get user details from frountend
    //validation - not empty
    //check if user already exists -> username,email
    //check for images,check for avtar
    //upload them to cloudinary,avtar
    //create user object -> create entry in db
    //remove password and refreseh token feild from response
    //check for user responce
    // return response

    const { username, email, password, fullName } = req.body;


    if (!username || !email || !password || !fullName) {
        throw new ApiError("All fields are mandatory", 400);
    }

    const existedUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (existedUser) {
        throw new ApiError("User already exists", 409);
    }


    const avtarLocalPath = req.files?.avtar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;  //both are now in server and not in cloudinary

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avtarLocalPath) { //cover image is optional
        throw new ApiError("Please upload avtar", 400);
    }

    const avtar = await uploadOnCloudinary(avtarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath); //both are now uploaded to cloudinary

    if(!avtar){
        throw new ApiError("Please upload avtar", 400);
    }

    const newUser = await User.create({
        fullName,
        avtar: avtar.url,
        coverImage: coverImage?.url || "",
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError("Something went wrong while registering user", 500);

}


    res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
        
        
})

const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //username or email
    //find the user
    //check for password
    //generate ascess and refresh token
    //send it to cookies
    //return response

    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new ApiError("Please provide username or email", 400);
    }

    const user = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    })

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError("Incorrect password", 400);
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200).cookie("refreshToken", refreshToken, options).cookie("accessToken", accessToken, options).json(
        new ApiResponse(
        200,
        {
            user: loggedInUser,accessToken,refreshToken,

        },
        "User logged in successfully"
        )
    )
})
        
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
      )

      const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {} , "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingrefreshToken){
        throw new ApiError("Unauthorized request", 401);
    }

    try {
        const decodedToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError("Invalid refresh token", 401);
        }
    
        if(incomingrefreshToken !== user?.refreshToken){
            throw new ApiError("Refresh token is expired or used", 401);
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const { newaccessToken, newrefreshToken } = await generateAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("refreshToken", newrefreshToken, options)
        .cookie("accessToken", newaccessToken, options)
        .json(new ApiResponse(200, { newaccessToken, refreshToken: newrefreshToken }, "Access token refreshed successfully"))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }