const mongoose = require("mongoose")

mongoose.connect(`mongodb+srv://shubhamjaishu:asdfghjkl@quiz.xyjcepw.mongodb.net/`)

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