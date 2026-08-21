import { rateLimit } from "express-rate-limit";

const commonOptions = {
    standardHeaders: "draft-8",
    legacyHeaders: false,
};

export const apiRateLimiter = rateLimit({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    limit: 300,
    message: {
        error: "Too many requests. Please wait a few minutes and try again.",
    },
});

export const authRateLimiter = rateLimit({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    message: {
        error: "Too many unsuccessful attempts. Please wait 15 minutes and try again.",
    },
});
