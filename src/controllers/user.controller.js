import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponce.js";



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

export { registerUser }