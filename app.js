import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import cookieParser from "cookie-parser";


const app = express();
const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "capitals",
  password: "[{(4better)}]",
  port: 5432,
};
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());
app.use(
  session({
    secret:"strong-key",
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false,
    maxAge:360000
  //maxAge defines the duration of the session}
  }}
  )
)
app.get("/",(req,res)=>{
    res.render("home.ejs");
})

app.get("/register",(req,res)=>{
    res.render("register.ejs");
})
app.get("/login",(req,res)=>{
  res.render("login.ejs")
})

app.get("/views/classb.ejs",(req,res)=>{
  if(req.session.authenticated||sec=='B'){
    res.render("classb.ejs");
  }else{
    res.send("Not authenticated");
  }
})

app.get("/views/register/user",(req,res)=>{
  if(req.session.authenticated){
    res.render("userreg.ejs")
  }else{
    res.render("Not authenticated")
  }
})

app.get("views\\class2.ejs",(req,res)=>{

  if(req.session.authenticated){
    res.render("class2.ejs");
  }else{
    res.send("Not authenticated");
  }
})



app.post("/login",async(req,res)=>{
  const username=req.body["username"];
    const password=req.body["password"];
    const salt=await bcrypt.genSalt(15);
    const hash=await bcrypt.hash(password,salt);
    const db=new pg.Client(dbConfig);
    try{
      await db.connect();
      const resu = await db.query("SELECT * FROM userlogin WHERE uname =$1",[username]);
      const storedhash=resu.rows[0].upassword;
      const mode=resu.rows[0].umode;
      const sec=resu.rows[0].div;
      if(await bcrypt.compare(password,storedhash)){
        if(mode=="admin"||mode=="teacher")
        {req.session.authenticated=true;
        res.render("homepg.ejs");
      }
    }else{
        res.send("Username or password does'nt match");
      }
    }catch(err){
      console.error("Error carrying out the query",err);
    }finally{
      db.end((endErr)=>{
        if(endErr){
          console.error("Connection couldn't be terminated");
        }else{
          console.log("Connection closed successfully");
        }
      })
    }
});;
app.post("/register",async (req,res)=>{
    const username=req.body["username"];
    const password=req.body["password"];
    const type=req.body["usertype"]
    const salt= await bcrypt.genSalt(15);
    const hash=await bcrypt.hash(password,salt);
    const db=new pg.Client(dbConfig);
    try {
        await db.connect();
    
        const result = await db.query("INSERT INTO userlogin VALUES ($1, $2,$3)", [username, hash,type]);
        
        console.log("Query successful");
        
        res.redirect("/");
      } catch (err) {
        console.error("Error executing query", err);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        db.end((endErr) => {
          if (endErr) {
            console.error("Connection couldn't terminate", endErr);
          } else {
            console.log("Connection terminated successfully");
          }
        });
      }
    });
    
    app.listen(3000, () => {
      console.log("Server open..");
    });

    //if (comp.rows[0].password === result.rows[0].password)