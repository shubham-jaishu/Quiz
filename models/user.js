const mongoose = require("mongoose")

mongoose.connect(`mongodb://127.0.0.1:27017/mini-1`)

const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    profilepic: {
        type: String,
        default: "image_profile.png"
    },
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "post",
            default: []
        }
    ]
})

module.exports = mongoose.model("user", userSchema)