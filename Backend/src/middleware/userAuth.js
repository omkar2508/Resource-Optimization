import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: "Not authorized, login again" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({ success: false, message: "Not authorized" });
        }

        req.userId = decoded.id;  // FIXED

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Not authorized" });
    }
};

export default userAuth;
