import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import  jwt from "jsonwebtoken";
import { User } from "../models/user.model";


export const verifyJWT = asyncHandler(async (req, res, next) => 
    {
        try {
            const token = req.cookies?.accessToken || req.headers("Authorization")?.replace("Bearer ", "");
    
            if(!token){
                return next(new ApiError("Unauthorized", 401));
            }
    
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            
            const user = await User.findById(decoded?._id).select("-password -refreshToken")
    
            if(!user){
                throw new ApiError("Unauthorized", 401);
            }

            req.user = user;
            next();
        } catch (error) {
            throw new ApiError(401, error?.message || "Invalid access token");
        }
})