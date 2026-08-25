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

export const passwordResetRequestRateLimiter = rateLimit({
    ...commonOptions,
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: {
        error: "Too many password reset requests. Please try again in an hour.",
    },
});

export const passwordResetAttemptRateLimiter = rateLimit({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: {
        error: "Too many password reset attempts. Please wait 15 minutes and try again.",
    },
});

export const emailVerificationRequestRateLimiter = rateLimit({
    ...commonOptions,
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: {
        error: "Too many verification email requests. Please try again in an hour.",
    },
});

export const emailVerificationAttemptRateLimiter = rateLimit({
    ...commonOptions,
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: {
        error: "Too many email verification attempts. Please wait 15 minutes and try again.",
    },
});
