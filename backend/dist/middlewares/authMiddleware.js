import jwt from "jsonwebtoken";
export const checkAuth = (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1]; // Support both cookies and headers
    if (!token)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};
