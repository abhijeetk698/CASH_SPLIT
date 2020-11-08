const mongoose = require("mongoose");

var transactionSchema=new mongoose.Schema({
    to_userID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    from_userID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    amount:Number,
    created:{type:Date,default:Date.now}
});

module.exports = mongoose.model("Transaction",transactionSchema);