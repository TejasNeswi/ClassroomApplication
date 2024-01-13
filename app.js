import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import cookieParser from "cookie-parser";
import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "capitals",
  password: "[{(4better)}]",
  port: 5432,
};

//configuring multer
const storage=multer.memoryStorage();
const upload =multer({storage});





app.set('view engine','ejs')
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
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

//get request to the homepage
app.get("/",(req,res)=>{
    res.render("home.ejs");
})



//get request to the login form
app.get("/login",(req,res)=>{
  res.render("login.ejs")
})


//get request to the user registration
app.get("/views/userreg.ejs",(req,res)=>{
  const usermode =req.session.mode;
  if(usermode=="admin"){
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


//login page server code 
app.post("/login", async (req, res) => {
  const username = req.body["username"].trim();
  const password = req.body["password"].trim();
  const salt = await bcrypt.genSalt(5);
  const hash = await bcrypt.hash(password, salt);
  const db = new pg.Client(dbConfig);
  console.log(username)
  try {
      await db.connect();
      const result = await db.query("SELECT * FROM userlogin WHERE uname = $1", [username]);
      const storedHash = result.rows[0].upassword;
      const mode = result.rows[0].umode;
      const sec = result.rows[0].div;
      req.session.sec=sec
      req.session.mode=mode

      if (await bcrypt.compare(password, storedHash)) {
        
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
          
      });
  }
});

app.get("/logout.ejs",(req,res)=>{
  req.session.destroy();
  res.redirect("/login")
})
// Handles get requests to cy
app.get("/views/cy.ejs", (req, res) => {
  const userSec = req.session.sec;
  const userMode = req.session.mode;
  console.log(userMode);

      if (userMode == 'admin' || (userMode !== 'admin' && userSec == "CY")) {
          res.render("cy.ejs");
      } else {
          res.send("Unauthorized access");
      }
  
});

//get request to attendance page
app.get("/views/cya.ejs",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='admin'||usermode==='teacher'){
    res.render("cya.ejs")
  }else{
    res.send("Unauthorized access")
  }
})


//get request to material page
app.get("/views/cym.ejs",async (req,res)=>{
  const db = new pg.Client(dbConfig);
  const usersec=req.session.sec
  try {
      await db.connect();
      console.log("Connected to the database");

      // Retrieve materials
      const materials = await db.query("SELECT d_id, d_name FROM materials WHERE div=$1",[usersec]);
      

          res.render("cym.ejs", { materials: materials.rows });
      
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
  } finally {
      // Close the database connection
      db.end();
  }
})

// verification for student or teacher mode
app.get("/views/cymc.ejs",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='teacher'){
    res.redirect("cym.ejs")
  }else{
    res.redirect("cyms.ejs")
  }
})

//rendering material for cy students
app.get("/views/cyms.ejs", async (req, res) => {
  const db = new pg.Client(dbConfig);
  const usersec=req.session.sec
 let noMaterials=false;
  try {
      await db.connect();
      console.log("Connected to the database");
      
      // Retrieve materials
      const materials = await db.query("SELECT d_id, d_name FROM materials WHERE div=$1",[usersec]);
     
      if(materials.rows===0){
        noMaterials=true
        res.render("cyms.ejs",{materials:[],noMaterials:noMaterials})
        
      }
        else{
          // Render the template with materials
          res.render("cyms.ejs", { materials: materials.rows,noMaterials:noMaterials });
          
        }
      
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
  } finally {
      // Close the database connection
      db.end();
  }
});




//handles get requests to cd
app.get("/views/cd.ejs",(req,res)=>{ 
  const userSec = req.session.sec;
  const userMode = req.session.mode;

      if (userMode === 'admin' || (userMode !== 'admin' && userSec == "CD")) {
          res.render("cd.ejs");
      } else {
          res.send("Unauthorized access");
      }
  
})

//verification for usermode
app.get("/views/cdc",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='teacher'){
    res.redirect("cdm.ejs")
  }else{
    res.redirect("cdms.ejs")
  }
})


//rendering material for cd students
app.get("/views/cdms.ejs", async (req, res) => {
  const db = new pg.Client(dbConfig);
  const usersec=req.session.sec
  console.log(usersec)
 let noMaterials=false;
  try {
      await db.connect();
      console.log("Connected to the database");
      
      // Retrieve materials
      const materials = await db.query("SELECT d_id, d_name FROM materials WHERE div=$1",[usersec]);
      console.log("Materials retrieved from the database:", materials.rows);
      if(materials.rows===0){
        noMaterials=true
        res.render("cdms.ejs",{materials:[],noMaterials:noMaterials})
        
      }
        else{
          // Render the template with materials
          res.render("cdms.ejs", { materials: materials.rows,noMaterials:noMaterials });
          
        }
      
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
  } finally {
      // Close the database connection
      db.end();
  }
});



//get request to attendance page
app.get("/views/cda.ejs",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='admin'||usermode==='teacher'){
    res.render("cda.ejs")
  }else{
    res.send("Unauthorized access")
  }
})


//get request to material page for teachers
app.get("/views/cdm.ejs",async (req,res)=>{
  const db = new pg.Client(dbConfig);
  const usersec=req.session.sec
  try {
      await db.connect();
      console.log("Connected to the database");

      // Retrieve materials
      const materials = await db.query("SELECT d_id, d_name FROM materials WHERE div=$1",[usersec]);
      

          res.render("cdm.ejs", { materials: materials.rows });
      
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
  } finally {
      // Close the database connection
      db.end();
  }
})




// Handles get requests to cse
app.get("/views/cse.ejs", (req, res) => {
  const userSec = req.session.sec;
  const userMode = req.session.mode;

      if (userMode === 'admin' || (userMode !== 'admin' && userSec === "CSE")) {
          res.render("cse.ejs");
      } else {
          res.send("Unauthorized access");
      }
  
});




//verification for usermode
app.get("/views/csc",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='teacher'){
    res.redirect("csm.ejs")
  }else{
    res.redirect("csms.ejs")
  }
})


//rendering material for cs students
app.get("/views/csms.ejs", async (req, res) => {
  const db = new pg.Client(dbConfig);
  const usersec=req.session.sec
  console.log(usersec)
 let noMaterials=false;
  try {
      await db.connect();
      console.log("Connected to the database");
      
      // Retrieve materials
      const materials = await db.query("SELECT d_id, d_name FROM materials WHERE div=$1",[usersec]);
      if(materials.rows===0){
        noMaterials=true
        res.render("csms.ejs",{materials:[],noMaterials:noMaterials})
       
      }
        else{
          // Render the template with materials
          res.render("csms.ejs", { materials: materials.rows,noMaterials:noMaterials });
         
        }
      
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
  } finally {
      // Close the database connection
      db.end();
  }
});



//get request to attendance page
app.get("/views/csa.ejs",(req,res)=>{
  const usermode=req.session.mode;
  if(usermode==='admin'||usermode==='teacher'){
    res.render("csa.ejs")
  }else{
    res.send("Unauthorized access")
  }
})


//get request to material page for teachers
app.get("/views/csm.ejs",async (req,res)=>{
  const db = new pg.Client(dbConfig);
  const usersec=req.session.sec
  try {
      await db.connect();
      console.log("Connected to the database");

      // Retrieve materials
      const materials = await db.query("SELECT d_id, d_name FROM materials WHERE div=$1",[usersec]);
      

          res.render("csm.ejs", { materials: materials.rows });
      
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
  } finally {
      // Close the database connection
      db.end();
  }
})


//deleting code 
app.delete('/delete_material/:materialId',async (req,res)=>{
  const m_id=parseInt(req.params.materialId);
  const db=new pg.Client(dbConfig);
  try{
      await db.connect();
      const success= await db.query("DELETE  FROM materials WHERE d_id =$1",[m_id]);
      if(success.rowCount>0){
        res.json({ success: true, message: 'Material deleted successfully' });
  } else{
    res.status(404).json({ success: false, message: 'Material not found' });
  }
  }catch(error){
    console.error('Error executing DELETE query:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }finally{
    db.end((endErr) => {
      if (endErr) {
        console.error("Connection couldn't terminate", endErr);
      } else {
        console.log("Connection terminated successfully");
      }
    });
  }
  
})



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
        res.render("homepg.ejs")
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
    

    app.post('/upload_material', upload.single('materialUpload'), async (req, res) => {
        const usermode=req.session.mode
        const usersec=req.session.sec
        if(usermode!=='teacher'){
          res.send("Unauthorized action")
        }
        const fileName = req.file.originalname;
        const fileData = req.file.buffer;
        const db= new pg.Client(dbConfig)
       try{
        await db.connect();
        // Use the pool to insert the file into the database
        const result = await db.query('INSERT INTO materials (d_name,doc,div)  VALUES ($1, $2,$3) RETURNING d_id', [fileName, fileData,usersec]);
        res.redirect("/views/cym.ejs")
      } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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
    






    






    
  
  app.get('/material/:id', async (req, res) => {
      const materialId = req.params.id;
      const db = new pg.Client(dbConfig);
  
      try {
          await db.connect();
          const result = await db.query('SELECT d_name, doc FROM materials WHERE d_id = $1', [materialId]);
          const material = result.rows[0];
  
          if (!material) {
              res.status(404).send('Material not found');
              return;
          }
  
          // Assuming you want to serve a PDF file, adjust the content type accordingly
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${material.d_name}"`);
          res.send(material.doc);
      } catch (error) {
          console.error('Error retrieving material:', error);
          res.status(500).send('Internal Server Error');
      } finally {
          db.end();
      }
  });
  


    app.listen(3000, () => {
      console.log("Server open..");
    });
