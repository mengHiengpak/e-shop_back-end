const { mongo, default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: [true, 'need to require name!']
    },
    email: {
        type: String,
        required: [true, 'need to require email!'], // <-- Fix here
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        minLength: 6,
        select: false,
        required: [true, 'need to require password!']
    },
    role: {
        type: String,
        enum: ['super', 'admin', 'cashier'],
        required: [true, 'need to require role!'],
        set: (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
        validate: {
            validator: (value) => ['super', 'admin', 'cashier'].includes(String(value).trim().toLowerCase()),
            message: 'role must be one of: super, admin, cashier'
        }
    }
}, { timestamps: true })

const Users = mongoose.model('User', userSchema);

module.exports = Users