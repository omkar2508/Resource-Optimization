import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const userAuth = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: "Not authorized, login again" 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({ 
                success: false, 
                message: "Not authorized" 
            });
        }

        const user = await userModel.findById(decoded.id)
          .select("name email role department admissionYear division batch isAccountVerified");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        req.userId = user._id;
        req.userName = user.name;
        req.userEmail = user.email;
        req.userRole = user.role;
        req.userDepartment = user.department;         
        req.userAdmissionYear = user.admissionYear;    
        req.userDivision = user.division;            
        req.userBatch = user.batch;                    
        req.isAccountVerified = user.isAccountVerified;

        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: "Not authorized" 
        });
    }
};

export default userAuth;