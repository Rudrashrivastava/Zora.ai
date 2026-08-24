import { body, validationResult } from "express-validator";

export const registerValidation = async (req, res, next) => {

    await body("username")
        .trim()
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3 }).withMessage("Username must be at least 3 characters")
        .run(req);

    await body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Enter a valid email")
        .run(req);

    await body("password")
        .trim()
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
        .run(req);

    // 🔍 check errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    next();
};