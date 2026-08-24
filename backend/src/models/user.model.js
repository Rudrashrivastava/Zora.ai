import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const refreshTokenSchema = new mongoose.Schema(
    {
        // SHA-256 hash of the refresh token string
        tokenHash: {
            type: String,
            required: true,
            index: true,
        },
        // Family ID for token rotation & compromise detection tracking
        familyId: {
            type: String,
            default: "",
        },
        // When this refresh token was issued (for expiry tracking)
        createdAt: {
            type: Date,
            default: Date.now,
            // Automatically expire subdocuments after 7 days
            expires: 60 * 60 * 24 * 7,
        },
        // Client device metadata
        userAgent: {
            type: String,
            default: "",
        },
        ipAddress: {
            type: String,
            default: "",
        },
    },
    { _id: true }
);

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        // Array of active refresh tokens (multi-device session management)
        refreshTokens: [refreshTokenSchema],
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Compare plain password against bcrypt hash
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.model('User', userSchema);

export default userModel;