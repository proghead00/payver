import jwt from "jsonwebtoken";
export const checkAuth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    }
    catch (error) {
        console.log({ error });
        res.status(401).json({ message: "Invalid token" });
    }
};
