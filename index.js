const express = require("express");
const mongoose= require("mongoose");
const bodyParser=require("body-parser");
const methodOverride=require('method-override');
const passport=require("passport");
const localStrategy = require("passport-local");

const app=express();
const graphOp=require("./utils/graphOperations");

const uri ="mongodb://localhost/cashSplitV2";
mongoose
     .connect( uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
     .then(() => console.log( 'Database Connected...' ))
     .catch(err => console.log( err ));

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

/**********************DB CONFIG*******************/
const Transaction=require("./models/transaction");
const User=require("./models/user");
const transaction = require("./models/transaction");

/**********************PASSPORT CONFIG*****************/
app.use(require("express-session")({
    secret : "do you know god of death likes apples",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{
    res.locals.currentUser=req.user;
    next();
});


app.get("/",isLoggedIn,(req,res)=>{
    res.redirect("/user");
});

app.get("/user",isLoggedIn,(req,res)=>{
    User.find({},(err,users)=>{
        if(err){
            console.log("error fetching the user");
        }else{
            global.allUsers=users;
            let user1=req.user.username;
            let txn=[];
            Transaction.find({},(err,transactions)=>{
                if(err){
                    console.log("error while fetching the transactions");
                    console.log(err);
                }else{
                    let n=transactions.length;
                    for(var i=0;i<n;i++){
                        let obj={};
                        if((transactions[i].to===user1)||(transactions[i].from===user1)){
                            obj["from"]=transactions[i].from;
                            obj["to"]=transactions[i].to;
                            obj["amount"]=transactions[i].amount;
                            txn.push(obj);
                        }
                    }
                    res.render("user",{currUser:req.user,allUsers:allUsers,txn:txn});
                }
            })    
            
        }
    })
});


app.get("/user/:username",isLoggedIn,(req,res)=>{
    let txn=[];
    let index=0;
    let user1=req.user.username;
    let user2=req.params.username;
    Transaction.find({},(err,transactions)=>{
        if(err){
            console.log("error while fetching the transactions");
            console.log(err);
        }else{
            let n=transactions.length;
            for(var i=0;i<n;i++){
                let obj={};
                if((transactions[i].from===user1 && transactions[i].to===user2)||transactions[i].to===user1 && transactions[i].from===user2){
                    obj["from"]=transactions[i].from;
                    obj["to"]=transactions[i].to;
                    obj["amount"]=transactions[i].amount;
                    txn.push(obj);
                }
            }
        }
    })
    setTimeout(()=>{
        console.log(txn);
        res.render("transactions.ejs",{
            user1:user1,
            user2:user2,
            txn:txn      
        })
    },1000);
})


app.post("/user/:username",isLoggedIn,(req,res)=>{
    var amt=req.body.amount;
    Transaction.create({
        from:req.user.username,
        to:req.params.username,
        amount:amt,
        doneBy:req.user.username
    },(err,txn)=>{
        if(err){
            console.log("error generating transaction");
        }else{
            console.log(txn);
            res.redirect(`/user/${req.params.username}`);
        }
    });
})  

//*********************************PASSPORT ROUTES ****************************************

app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    var newUser = {
        username:req.body.username,
        email:req.body.emailID,
        firstName:req.body.firstName,
        lastName:req.body.lastName
    };
    User.register(newUser,req.body.password,(err,user)=>{
        if(err){
            console.log(err.name);
            return res.redirect("/register");
        }passport.authenticate("local")(req,res,()=>{
            res.redirect("/user");
        });
    })
});


app.get("/login",(req,res)=>{
    res.render("login");
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/user",
    failureRedirect:"/register"
}),(req,res)=>{
});

app.get("/logout",(req,res)=>{
    req.logOut();
    res.redirect("/");
});

function isLoggedIn(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }else{
        res.redirect("/login");
    }
}


var PORT = process.env.PORT||3000;
app.listen(PORT,(req,res)=>{
    console.log("server is running");
});