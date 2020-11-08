const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");


const userSchema = new mongoose.Schema({
    username: String,
    password : String,
    firstName: String,
    lastName : String,
    email : String,
    givenTo:[String],
    givenAmount:[Number],
    takenFrom:[String],
    takenAmount:[Number]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",userSchema);