import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: [true, "email required"],
        lowercase: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: [true, "username required"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "password required"],
        minlength: [6, "password must be at least six characters"],
        trim: true,
        select: false
    },
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// 🔐 Hash password
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// 🔑 Compare password
userSchema.methods.comparePassword = function (cp) {
    return bcrypt.compare(cp, this.password);
};

const userModel = mongoose.model("users", userSchema);

export default userModel;