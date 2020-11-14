const mongoose = require("mongoose");

var transactionSchema=new mongoose.Schema({
    from:String,
    to:String,
    doneBy:String,
    amount:Number,
    created:{type:Date,default:Date.now}
});

module.exports = mongoose.model("Transaction",transactionSchema);