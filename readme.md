# Project Setup instructions
1. Clone the project
```
git clone 
```
2. Move into the directory
```
cd Classroom
```
3. If `package.json` does n't exist enter the following code into the terminal
```
npm init
```

4. Install dependencies
```
npm install
```

5. Run the server
```
node app.js
```
6. if the server needs to be constantly restarted i.e., alternative to nodemon
```
node --watch app.js 
```

### Setting up the database 
1. Install postgress with default setup (remember the password used during setup)
```
https://www.postgresql.org/download/
```

2. Create a database using pgadmin (installed by default during installation of postgres)

3. Setting up dbConfig(in app.js)

const dbConfig = {
  user: "postgres",
  host: "localhost",
  database: "capitals", -change this to the database name set up by you
  password: "[{(4better)}]", - change this to the password set up by you
  port: 5432,
};


4. Create a table named userlogin with the following code in the query tool

```
create table userlogin(
    uname varchar unique,
    upassword varchar,
    umode varchar,
    div varchar
);
```

5. Create the first admin using the following code in query tool 
insert into userlogin 
(uname,upassword,umode)values('adminaccountname','password','admin',')

6. Create a table named materials with the following code in query tool 
```
create table materials (
        d_id int unique,
        d_name varchar unique,
        doc bytea,
        div varchar
);

```

### Pending jobs(please update as modified)

1. Addition of routes to the cie page (if needed)
2. CSS styling for all the pages as needed 
