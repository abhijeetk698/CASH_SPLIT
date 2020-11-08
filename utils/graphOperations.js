var User=require("../models/user");
var Transaction = require("../models/transaction");

function addTransaction(user1,amount){
    User.find({},(err,users)=>{
        if(err){
            console.log(err);
        }else{
            for(var i=0;i<(users.length);i++){
                if(user1.username!=users[i].username){
                    (function(user2) {
                        Transaction.create({
                            to_userID:user2,
                            from_userID:user1,
                            amount:amount           
                        },(err,transaction)=>{
                            if(err){console.log(err);}
                            else{
                                user1.givenTo.push(user2.username);
                                user1.givenAmount.push(amount);
                                user1.save();
                                user2.takenFrom.push(user1.username);
                                user2.takenAmount.push(amount);
                                user2.save();
                                // User.find({username:user1.username},(err,user)=>{
                                //     if(err){
                                //         console.log(err);
                                //     }else{
                                //         console.log(user.givenTo)
                                //         user.givenTo.push(user2.username);
                                //         user.givenAmount.push(amount);
                                //         user.save();
                                //         User.find({username:user2.username},(err,user)=>{
                                //             if(err){
                                //                 console.log(err);
                                //             }else{
                                //                 user.takenFrom.push(user1.username);
                                //                 user.takenAmount.push(amount);
                                //                 user.save();
                                //                 console.log(user);
                                //             }
                                //         })
                                //     }
                                // })
                            }
                        })
                     })(users[i]);
            }
            }
        }
    })
}




module.exports={
    addTransaction,
}