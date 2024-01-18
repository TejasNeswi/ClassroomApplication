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
import ExcelJS from 'exceljs'
import { render } from "ejs";

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


//login page server code 
app.post("/login", async (req, res) => {
  const username = req.body["username"].trim();
  const password = req.body["password"].trim();
  
  const salt = await bcrypt.genSalt(5);
  const hash = await bcrypt.hash(password, salt);
  const db = new pg.Client(dbConfig);
 
  try {
      await db.connect();
      const result = await db.query("SELECT * FROM userlogin WHERE uname = $1", [username]);
      const storedHash = result.rows[0].upassword;
      const mode = result.rows[0].umode;
      const sec = result.rows[0].div;
      const sub=result.rows[0].subject;
      req.session.sec=sec;
      req.session.mode=mode;
      req.session.sub=sub;
      
      if (await bcrypt.compare(password, storedHash)) {
        if(mode=='admin'){
          res.render("homepg.ejs");
        }else{
        
        res.render("cd.ejs",{pageTitle:req.session.sec,mode:req.session.mode})
        } 
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


app.get("/views/cdm.ejs", async (req, res) => {
  const db = new pg.Client(dbConfig);
  const usersec = req.session.sec;
  const sub=req.session.sub;

  try {
      await db.connect();
      console.log("Connected to the database");

      // Retrieve materials
      
      const materialsResult = await db.query("SELECT d_id, d_name, sec FROM materials WHERE (div,subject)=($1,$2)", [usersec,sub]);
      const materials = materialsResult.rows;

      // Group materials by section
      const sectionsMap = new Map();
      materials.forEach(material => {
          const sectionKey = material.sec;
          if (!sectionsMap.has(sectionKey)) {
              sectionsMap.set(sectionKey, []);
          }
          sectionsMap.get(sectionKey).push(material);
      });

      const sections = Array.from(sectionsMap, ([name, materials]) => ({ name, materials }));

      res.render("cdm.ejs", { sections });
  } catch (error) {
      console.error("Error:", error);
      res.status(500).send("Server error");
  } finally {
      // Close the database connection
      db.end();
  }
});








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



const pool = new pg.Pool(dbConfig);

app.post("/register", upload.single('excelFile'), async (req, res) => {
  const client = await pool.connect();

  try {
    const fileBuffer = req.file.buffer;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.getWorksheet(1);

    await client.query('BEGIN');

    const promises = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const username = String(row.getCell(1).value).trim();
      const password = String(row.getCell(2).value).trim();
      const type = String(row.getCell(3).value).trim();
      const sec = String(row.getCell(4).value).trim();
      const sub = String(row.getCell(5).value).trim();

      const passwordString = String(password);

      try {
        const saltRounds = 5;
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(passwordString, salt);

        let queryText, queryParams;

        if (type === "teacher") {
          queryText = `
            INSERT INTO userlogin (uname, upassword, umode, div, subject)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (div, subject) DO NOTHING`;
          queryParams = [username, hash, type, sec, sub];
        } else {
          queryText = `
            INSERT INTO userlogin (uname, upassword, umode, div)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (uname,div) DO NOTHING`;
          queryParams = [username, hash, type, sec];
        }

        const queryPromise = client.query(queryText, queryParams)
          .then(result => {
            // Check if the row was actually inserted
            if (result.rowCount === 1) {
              console.log(`User ${username} inserted successfully`);
            } else {
              console.log(`User ${username} already exists or conflict occurred`);
              // Handle conflict response
              res.status(409).json({ error: `User ${username} already exists or conflict occurred` });
            }
          });
        promises.push(queryPromise);
      } catch (hashError) {
        console.error('Error hashing password for user', username, hashError);
      }
    }

    await Promise.all(promises);
    await client.query('COMMIT');
    console.log("Data inserted successfully");
    res.render("homepg.ejs");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error processing Excel file", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  } finally {
    client.release();
    console.log("Connection released");
  }
});

app.get("/views/reset.ejs", (req, res) => {
  const errorMessage = req.query.error ? 'An error occurred during password reset.' : '';
  const successMessage = req.query.success ? 'Password reset successfully.' : '';

  res.render("reset.ejs", { errorMessage, successMessage });
});


app.post('/reset-password', async (req, res) => {
  const username = req.body.username.trim();
  const oldPassword = req.body.oldPassword.trim();
  const newPassword = req.body.newPassword.trim();
  const confirmPassword = req.body.confirmPassword.trim();

  // Validate new password and confirmation
  if (newPassword !== confirmPassword) {
    return res.redirect('/views/reset.ejs?error=Passwords do not match');
  }

  const db = new pg.Client(dbConfig);

  try {
    await db.connect();

    // Retrieve the old password from the database
    const result = await db.query("SELECT upassword FROM userlogin WHERE uname = $1", [username]);

    if (result.rows.length === 0) {
      return res.redirect('/views/reset.ejs?error=User not found');
    }

    const oldHash = result.rows[0].upassword;

    // Compare the old password with the provided old password
    const isOldPasswordValid = await bcrypt.compare(oldPassword, oldHash);

    if (!isOldPasswordValid) {
      return res.redirect('/views/reset.ejs?error=Incorrect old password');
    }

    // Update password in the database based on the username
    const newSalt = await bcrypt.genSalt(5);
    const newHash = await bcrypt.hash(newPassword, newSalt);

    await db.query("UPDATE userlogin SET upassword = $1 WHERE uname = $2", [newHash, username]);

    res.redirect('/views/reset.ejs?success=Password reset successfully');
  } catch (err) {
    console.error('Error carrying out the query', err);
    res.redirect('/views/reset.ejs?error=Internal Server Error');
  } finally {
    db.end((endErr) => {
      if (endErr) {
        console.error('Connection couldn\'t be terminated');
      } else {
        console.log('Connection closed successfully');
      }
    });
  }
});




    app.post('/upload_material', upload.single('materialUpload'), async (req, res) => {
        const usermode=req.session.mode
        const usersec=req.session.sec
        const sub=req.session.sub
        if(usermode!=='teacher'){
          res.send("Unauthorized action")
        }
        const fileName = req.body.fileName;
        const fileData = req.file.buffer;
        const fileSec=req.body.sec;
        const db= new pg.Client(dbConfig)
       try{
        await db.connect();
        // Use the pool to insert the file into the database
        console.log(fileName)
        console.log(fileSec)
        console.log(usersec)
        const result = await db.query('INSERT INTO materials (d_name,doc,div,subject,sec)  VALUES ($1, $2,$3,$4,$5) RETURNING d_id', [fileName, fileData,usersec,sub,fileSec]);
        res.redirect("/views/cdm.ejs")
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
