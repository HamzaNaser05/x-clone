import jwt from "jsonwebtoken"

const getCookieOptions = () => ({
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
});

export const generateTokenAndSetCookie = ({ userId, tokenVersion, res }) => {
    const token = jwt.sign({ userId, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: '15d'
    })

    res.cookie("jwt", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000,// MS
        ...getCookieOptions(),
    })
}

export const clearAuthCookie = (res) => {
    res.clearCookie("jwt", getCookieOptions());
};
