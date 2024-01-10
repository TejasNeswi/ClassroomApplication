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

app.set('view engine','ejs')
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

app.get("/views/userreg.ejs",(req,res)=>{
  if(req.session.authenticated){
    res.render("userreg.ejs")
  }else{
    res.send("Not authenticated")
  }
})

app.get("views\\class2.ejs",(req,res)=>{

  if(req.session.authenticated){
    res.render("class2.ejs");
  }else{
    res.send("Not authenticated");
  }
})



app.post("/login", async (req, res) => {
  const username = req.body["username"];
  const password = req.body["password"];
  const salt = await bcrypt.genSalt(5);
  const hash = await bcrypt.hash(password, salt);
  const db = new pg.Client(dbConfig);

  try {
      await db.connect();
      const result = await db.query("SELECT * FROM userlogin WHERE uname =$1", [username]);
      const storedHash = result.rows[0].upassword;
      const mode = result.rows[0].umode;
      const sec = result.rows[0].div;

      if (await bcrypt.compare(password, storedHash)) {
        if(mode=='admin'){
          req.session.authenticated=true;
        }  
        res.render("homepg.ejs")
          
      } else {
          res.send("Username or password doesn't match");
          return; // Exit the function early if password doesn't match
      }
  } catch (err) {
      console.error("Error carrying out the query", err);
      res.status(500).send("Internal Server Error");
      return; // Exit the function early in case of an error
  } finally {
      db.end((endErr) => {
          if (endErr) {
              console.error("Connection couldn't be terminated");
          } else {
              console.log("Connection closed successfully");
          }
          // No need to check req.session.authenticated here
          // Render the home page here after ensuring the database connection is closed
          
      });
  }
});

app.post("/register",async (req,res)=>{
    const username=req.body["username"];
    const password=req.body["password"];
    const type=req.body["usertype"]
    const sec=req.body["section"]
    const salt= await bcrypt.genSalt(5);
    const hash=await bcrypt.hash(password,salt);
    const db=new pg.Client(dbConfig);
    try {
        await db.connect();
    
        const result = await db.query("INSERT INTO userlogin VALUES ($1, $2,$3,$4)", [username, hash,type,sec]);
        
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