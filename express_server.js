//Utilities
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());



//"database" and helper function
const generateRandomString = () => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

///GET endpoints

app.get("/register", (req, res) => {
  let templateVars = { user : users[req.cookies.user_id] };
  res.render("registration", templateVars);
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user : users[req.cookies.user_id]
  };
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  let templateVars = { user : users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {
    user : users[req.cookies.user_id],
    urls: urlDatabase,
  };
  const longURL = urlDatabase[req.params.shortURL];
  const shortURL = req.params.shortURL;
  if (Object.keys(urlDatabase).includes(shortURL)) {
    res.redirect(longURL);
  } else {
    res.redirect("urls_index", templateVars);
  }
});


app.get("/urls/:shortURL", (req, res) => {
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user : users[req.cookies.user_id]
  };
  res.render("urls_show", templateVars);
});

///POST endpoints

app.post("/urls", (req, res) => {
  let templateVars = { user : users[req.cookies.user_id] };
  const id = generateRandomString();
  if (req.body.longURL.match(/^(https:\/\/|http:\/\/)/)) {
    urlDatabase[id] = req.body.longURL;
  } else {
    urlDatabase[id] = "http://" + req.body.longURL;
  }
  res.redirect(`/urls/${id}`, templateVars);
});

app.post("/register", (req,res) => {
  const newId = generateRandomString();
  users[newId] = req.body;
  users[newId].id = newId;
  res.cookie("user_id", users[newId].id).redirect("/urls");
});

app.post("/login", (req, res) =>{
  const username = req.body.username;
  res.cookie("username", username).redirect("/urls");
});

app.post("/logout", (req, res) =>{
  res.clearCookie("username").redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;
  if (req.body.longURL.match(/^(https:\/\/|http:\/\/)/)) {
    urlDatabase[id] = req.body.longURL;
  } else {
    urlDatabase[id] = "http://" + req.body.longURL;
  }
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});


/// Server Start

app.listen(PORT, () => {
});