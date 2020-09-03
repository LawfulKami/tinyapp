/* eslint-disable camelcase */
//Utilities
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const h = require("./helpers");
const methodOverride = require("method-override");


app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["not comfortable with all whose secrets"]
}));


//////////////
//"Database"//
//////////////

const urlDatabase = {
  "b2xVn2": { longURL :"http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL :"http://www.google.com", userId: "user2RandomID" }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

/////////////////
//GET endpoints//
/////////////////

app.get("/urls", (req, res) => {
  const { user_id } = req.session;
  const userURLS = h.urlsForUser(urlDatabase, user_id);
  let templateVars = {
    urls: userURLS,
    user : users[user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const { user_id } = req.session;
  let templateVars = { user : users[user_id] };
  res.render("registration", templateVars);
});

app.get("/login", (req, res) => {
  const { user_id } = req.session;
  let templateVars = { user : users[user_id] };
  res.render("login", templateVars);
});


app.get("/urls/new", (req, res) => {
  const { user_id } = req.session;
  if (!user_id) {
    res.redirect("/urls");
  }
  let templateVars = { user : users[user_id] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.body;
  let templateVars = {
    user : users[user_id],
    urls: urlDatabase,
  };
  const longURL = urlDatabase[shortURL].longURL;
  if (h.validateShortUrl(urlDatabase, shortURL)) {
    res.redirect(longURL);
  } else {
    res.redirect("/urls", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.params;
  if (!h.checkOwnership(urlDatabase, req)) {
    return res.redirect("/urls");
  }
  let templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user : users[user_id]
  };
  res.render("urls_show", templateVars);
});

//////////////////
//POST endpoints//
//////////////////

app.post("/urls", (req, res) => {
  const newId = h.generateRandomString();
  h.createNewUrl(urlDatabase, newId, req);
  res.redirect(`/urls/${newId}`);
});

app.put("/urls", (req, res) => {
  const { shortURL } = req.body;
  const { longURL } = req.body;
  if (h.checkUserUrls(urlDatabase, req)) {
    urlDatabase[shortURL].longURL = longURL;
    return res.redirect(`/urls/${shortURL}`);
  }
  const newId = h.generateRandomString();
  h.createNewUrl(urlDatabase, newId, req);
  res.redirect(`/urls/${newId}`);
});

app.post("/register", (req, res) => {
  const { email } = req.body;
  console.log(email);
  if (h.checkForEmail(users, email) || !email) {
    return res.status(400).end();
  }
  const newId = h.generateRandomString();
  h.createNewUser(users, newId, req);
  req.session.user_id = users[newId].id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { password } = req.body;
  const { email } = req.body;
  let id = h.getUserByEmail(users, email);
  if (!users[id]) {
    return res.status(403).send("No such user exists");

  } else if (bcrypt.compareSync(password, users[id].password)) {
    req.session.user_id = id;
    res.redirect("/urls");

  } else {
    res.status(403).send("Authentification failed");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = req.body;
  if (h.checkOwnership(urlDatabase, req)) {
    urlDatabase[shortURL].longURL = h.formatUrl(longURL);
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.redirect("/urls"); //Url does not belong to User.
  }
});

app.delete("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  if (h.checkOwnership(urlDatabase, req)) {
    delete urlDatabase[shortURL];
  }
  res.redirect("/urls");
});


/// Server Start

app.listen(PORT, () => {
  console.log(`TinyApp is listening on ${PORT}`);
});

