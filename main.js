// Imports
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const authRouter = require('./routes/auth'); 
const appRouter = require('./routes/routes'); 
const Item = require('./models/users');
const bcrypt = require("bcrypt");

const path = require("path");//
const collection = require("./models/consumer");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.urlencoded({extended: false}));

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Connection
mongoose
    .connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to the database!'))
    .catch((error) => console.error('Database connection error:', error));

// Middleware Setup

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Express session for flash messages (if necessary)
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'my_secret_key',
        saveUninitialized: true,
        resave: false,
    })
);

// Flash message middleware
app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

//login
app.get("/login", (req,res) => {
    res.render("login");
});
app.get("/signup", (req, res) => {
    res.render("signup", { title: "Signup" }); // Make sure signup.ejs exists in 'views' folder
});

// Register user
/*app.post("/signup", async (req, res) => {
    console.log("Signup request body:", req.body); // Debug
    const data = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    };

    // Check if email already exists
    const existingUser = await collection.findOne({ email: data.email });
    if (existingUser) {
        return res.status(400).send("User already exists. Please choose a different email.");
    }

    // Hash password and save
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;

    const userdata = new collection(data);
    await userdata.save();

    console.log("User registered:", userdata);
    res.status(201).send("User signed up successfully!");
});*/
// Register user
app.post("/signup", async (req, res) => {
    console.log("Signup request body:", req.body); // Debug
    const data = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
    };

    // Check if email already exists
    const existingUser = await collection.findOne({ email: data.email });
    if (existingUser) {
        req.session.message = { type: 'error', text: "User already exists. Please choose a different email." };
        return res.redirect("/signup");  // Redirect back to signup page with the error message
    }

    // Hash password and save
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;

    const userdata = new collection(data);
    await userdata.save();

    console.log("User registered:", userdata);
    req.session.message = { type: 'success', text: "User signup successfully!" };
    res.redirect("/login");
});

/* Login user
app.post("/login", async (req, res) => {
    try {
      console.log("Login request body:", req.body);
  
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).send("Email and password are required.");
      }
  
      // Find user in the database
      const user = await collection.findOne({ email });
      if (!user) {
        console.log("Email not found in DB:", email);
        return res.status(404).send("Email not found.");
      }
  
      // Compare passwords using bcrypt
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (isPasswordMatch) {
        req.session.user = user; // Store user in session
        return res.redirect("/");
      } else {
        return res.status(401).send("Incorrect password.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).send("An error occurred during login.");
    }
  });
  
  // Home Page (After Login)
  app.get("/home", async (req, res) => {
    if (!req.session.user) {
      return res.redirect("/");
    }
  
    try {
      const items = await Item.find();
      res.render("index", { title: "Home", items });
    } catch (err) {
      res.status(500).send("Failed to load home page.");
    }
  });*/
// Login User
app.post("/login", async (req, res) => {
    try {
        console.log("Login request body:", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            req.session.message = { type: 'error', text: "Email and password are required." };
            return res.redirect("/login");
        }

        // Find user in the database
        const user = await collection.findOne({ email });
        if (!user) {
            req.session.message = { type: 'error', text: "Email not found." };
            return res.redirect("/login");
        }

        // Compare passwords using bcrypt
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            req.session.message = { type: 'error', text: "Incorrect password." };
            return res.redirect("/login");
        }

        req.session.user = user; // Store user in session
        return res.redirect("/home");
    } catch (error) {
        console.error("Error during login:", error);
        req.session.message = { type: 'error', text: "An error occurred during login." };
        return res.redirect("/login");
    }
});

// Home Page (After Login)
app.get("/home", async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {
        const items = await Item.find();  // Fetch items from database
        res.render("index", { title: "Home", user: req.session.user, items });
    } catch (err) {
        res.status(500).send("Failed to load home page.");
    }
});

  
  // Logout Route
  app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send("Logout failed.");
      }
      res.redirect("/");
    });
  });

// Serve static files (e.g., uploaded images)
app.use(express.static('uploads'));

// Template Engine

app.set('view engine', 'ejs');

// static file
app.use(express.static("public"));

// Routes

// Authentication routes (JWT-based login/register/logout)
app.use('/auth', authRouter);

// Application routes (CRUD operations, dashboard, etc.)
app.use('/', appRouter);

// Start the Server
app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
 
module.exports = app;



