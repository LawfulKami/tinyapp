//Utilities
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");
const h = require("./helper");
const { checkOwnership } = require("./helper");

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
  const userURLS = h.urlsForUser(urlDatabase, req.session.user_id);
  let templateVars = {
    urls: userURLS,
    user : users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { user : users[req.session.user_id] };
  res.render("registration", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { user : users[req.session.user_id] };
  res.render("login", templateVars);
});


app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/urls");
  }
  let templateVars = { user : users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let templateVars = {
    user : users[req.session.user_id],
    urls: urlDatabase,
  };
  const longURL = urlDatabase[req.params.shortURL].longURL;
  const shortURL = req.params.shortURL;
  if (h.validateShortUrl(urlDatabase, shortURL)) {
    res.redirect(longURL);
  } else {
    res.redirect("/urls", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  if (!checkOwnership(urlDatabase, req)) {
    return res.redirect("/urls");
  }
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user : users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

//////////////////
//POST endpoints//
//////////////////

app.post("/urls", (req, res) => {
  if (h.checkUserUrls(urlDatabase, req)) {
    urlDatabase[req.body.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${req.body.longURL}`);
  } else {
    const newId = h.generateRandomString();
    h.createNewUrl(urlDatabase, newId, req);
    res.redirect(`/urls/${newId}`);
  }
});

app.post("/register", (req,res) => {
  if (h.checkForEmail(users, req.body.email) || !req.body.email) {
    res.status(400).end();
  }
  const newId = h.generateRandomString();
  h.createNewUser(users, newId, req);
  // eslint-disable-next-line camelcase
  req.session.user_id = users[newId].id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  let id = h.getUserbyEmail(users, email);
  if (!users[id]) {
    return res.status(403).send("No such user exists");

  } else if (bcrypt.compareSync(password, users[id].password)) {
    // eslint-disable-next-line camelcase
    req.session.user_id = id;
    res.redirect("/urls");

  } else {
    res.status(403).send("Authentification failed");
  }
});

app.post("/logout", (req, res) =>{
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const id = req.params.shortURL;
  if (h.checkOwnership(urlDatabase, req)) {
    urlDatabase[id] = h.formatUrl(req.body.longURL);
    res.redirect(`/urls/${id}`);
  } else {
    res.redirect("/urls"); //Url does not belong to User.
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  if (h.checkOwnership(urlDatabase, req)) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});


/// Server Start

app.listen(PORT, () => {
  console.log(`TinyApp is listening on ${PORT}`);
});

