const express = require("express");
const mongoose= require("mongoose");
const bodyParser=require("body-parser");
const methodOverride=require('method-override');
const passport=require("passport");
const localStrategy = require("passport-local");

const app=express();
const graphOp=require("./utils/graphOperations");

const uri = "mongodb+srv://abhijeet:dirtyclown@cluster0-lyzlv.mongodb.net/CashSplit?retryWrites=true&w=majority";
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
                            obj["created"]=transactions[i].created;
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
                    obj["created"]=transactions[i].created;
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
}); 

app.get("/settle",isLoggedIn,(req,res)=>{
    let map1={};
    let map2={};
    for(let i=0;i<allUsers.length;i++){
        map1[i]=allUsers[i].username;
        map2[allUsers[i].username]=i;
    }
    let graph=new Array(allUsers.length);
    for(let i=0;i<allUsers.length;i++){
        graph[i]=new Array(allUsers.length);
        for(let j=0;j<allUsers.length;j++){
            graph[i][j]=0;
        }
    }
    console.log(map2);
    Transaction.find({},(err,txns)=>{
        if(err){
            console.log("error while fetching transactions");
            console.log(err);
        }else{
            for(let i=0;i<txns.length;i++){
                let user1=map2[txns[i].from];
                let user2=map2[txns[i].to];
                graph[user2][user1]+=txns[i].amount;
            }
            console.log(graph);
            
        }
    })
    setTimeout(()=>{
        let N=allUsers.length;
        function getMin(arr){
            let minInd=0;
            for(var i=1;i<N;i++){
                if(arr[i]<arr[minInd]){
                    minInd=i;
                }
            }
            return minInd;
        }
        function getMax(arr){  
            let maxInd=0;
            for(let i=1;i<N;i++){
                if(arr[i]>arr[maxInd]){
                    maxInd=i;
                }
            }
            return maxInd;
        }

        function minOf2(x,y) 
        { 
            return (x<y)? x: y; 
        } 
    let txns=[];

    function minCashFlowRec(amt){
        console.log("amt--> " +amt);
        let obj={};
        let mxCredit=getMax(amt),mxDebit=getMin(amt);
        if((amt[mxCredit]===0) && (amt[mxDebit] == 0)){return;}
        let min=minOf2(-amt[mxDebit],amt[mxCredit]);
        amt[mxCredit] -= min;
        amt[mxDebit] += min;
        
        console.log("min = "+min+" maxDebit "+mxDebit+' maxCrdit'+mxCredit);
        obj["from"]=map1[mxDebit];
        obj["to"]=map1[mxCredit];
        obj["amount"]=min;
        console.log(obj);
        txns.push(obj);
        
        minCashFlowRec(amt);
        return;
    }


    //  void minCashFlow(int graph[][N]) 
    // { 
    //     // Create an array amount[], initialize all value in it as 0. 
    //     int amount[N] = {0}; 
    
    //     // Calculate the net amount to be paid to person 'p', and 
    //     // stores it in amount[p]. The value of amount[p] can be 
    //     // calculated by subtracting debts of 'p' from credits of 'p' 
    //     for (int p=0; p<N; p++) 
    //     for (int i=0; i<N; i++) 
    //         amount[p] += (graph[i][p] -  graph[p][i]); 
    
    //     minCashFlowRec(amount); 
    // } 
       function minCashFlow(){
           let amt=new Array(N);
           for(let i=0;i<N;i++){amt[i]=0;}
           
           for(let p=0;p<N;p++){
               for(let i=0;i<N;i++){
                   amt[p]+=(graph[i][p]-graph[p][i]);
               }
           }
           minCashFlowRec(amt);
       } 
       minCashFlow();
       let minTxns=[];
       console.log(txns);
       for(var i=0;i<txns.length;i++){
           if(txns[i].from==req.user.username){
                let obj={};
                obj["verdict"]="GIVE";
                obj["amount"]=txns[i].amount;
                obj["user"]=txns[i].to;
                minTxns.push(obj);
           }if(txns[i].to==req.user.username){
                let obj={};
                obj["verdict"]="TAKE";
                obj["amount"]=txns[i].amount;
                obj["user"]=txns[i].from;
                minTxns.push(obj);
            }
       }
       console.log(minTxns);
       res.render("settle.ejs",{txns:minTxns,currUser:req.user.username,alltxns:txns});
    },1000);
    
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