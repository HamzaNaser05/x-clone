export const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
    }

    return next();
};
