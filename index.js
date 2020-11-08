const express = require("express");
const mongoose= require("mongoose");
const bodyParser=require("body-parser");
const methodOverride=require('method-override');
const passport=require("passport");
const localStrategy = require("passport-local");

const app=express();
const graphOp=require("./utils/graphOperations");

const uri ="mongodb://localhost/cashSplit";
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
    res.redirect("/dashboard");
});

app.get("/dashboard",isLoggedIn,(req,res)=>{
    res.render("dashboard",{user:req.user});
});

app.get("/new",isLoggedIn,(req,res)=>{
    res.render("new");
})

app.post("/new",isLoggedIn,(req,res)=>{
    var amount=req.body.amount;
    User.countDocuments({},(err,count)=>{
        if(err){
            console.log(err);
        }else{
            graphOp.addTransaction(req.user,(amount/count))
            res.redirect("/");
        }
    })
});

app.get("/settle",isLoggedIn,(req,res)=>{
    var userName=req.query.username;
    User.find({username:userName},(err,user)=>{
        if(err){console.log(err);}
        else{
            var owe={}; //+
            var total={} //-
            for(var i=0;i<user[0].givenTo.length;i++){
                let person=user[0].givenTo[i];
                let amount=user[0].givenAmount[i];
                if(person in total){
                    total[person]+=amount;
                }else{
                    total[person]=amount;
                }
            }
            var debt={};
            for(var i=0;i<user[0].takenFrom.length;i++){
                let person=user[0].takenFrom[i];
                let amount=user[0].takenAmount[i];
                if(person in total){
                    total[person]-=amount;
                }else{
                    total[person]= (-1)*amount;
                }
            }
            for(person in total){
                if(total[person]>0){
                    owe[person]=total[person];
                }if(total[person]<0){
                    debt[person]=(-1)*total[person];
                }
            }
            console.log(user[0]);
            console.log(owe);
            console.log(debt);
            res.render("settle",{owe:owe,debt:debt});
            // res.send("settle ??")
        }
    })
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
            res.redirect("/dashboard");
        });
    })
});


app.get("/login",(req,res)=>{
    res.render("login");
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/dashboard",
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