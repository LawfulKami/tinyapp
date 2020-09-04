//Utilities
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const bcrypt = require("bcrypt");
const h = require("./helpers");
const methodOverride = require("method-override");
const { validateShortUrl } = require("./helpers");

app.use(cookieParser());
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
  "b2xVn2": { longURL :"http://www.lighthouselabs.ca", userId: "userRandomID", viewCount: 0, uniqueVisitors : 0, visits: [], dateCreated: new Date()},
  "9sm5xK": { longURL :"http://www.google.com", userId: "user2RandomID", viewCount: 0, uniqueVisitors: 0, visits: [], dateCreated: new Date() }
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

app.get("/", (req, res) => {
  const { user_id } = req.session;
  if (user_id) {
    return res.redirect("/urls");
  }
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const { user_id } = req.session;
  const userURLS = h.urlsForUser(urlDatabase, user_id);
  let templateVars = {
    urls: userURLS,
    user : users[user_id]
  };
  if (!user_id) {
    return res.status(400).render("error_messages/not_logged", templateVars);
  }
  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const { user_id } = req.session;
  let templateVars = { user : users[user_id] };
  if (!user_id) {
    res.render("registration", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const { user_id } = req.session;
  let templateVars = { user : users[user_id] };
  if (!user_id) {
    res.render("login", templateVars);
  } else {
    res.redirect("/urls");
  }
});


app.get("/urls/new", (req, res) => {
  const { user_id } = req.session;
  if (!user_id) {
    res.redirect("/login");
  }
  let templateVars = { user : users[user_id] };
  res.render("urls_new", templateVars);
});


app.get("/urls/:shortURL", (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.params;
  if (!h.checkOwnership(urlDatabase, req)) {
    const user = { user: users[user_id] };
    if (!validateShortUrl(urlDatabase, shortURL)) {
      return res.status(404).render("error_messages/invalid_url", user);
    } else if (!user_id) {
      return res.status(400).render("error_messages/not_logged", user);
    } else {
      return res.status(403).render("error_messages/url_not_owned", user);
    }
  }
  let templateVars = {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    viewCount: urlDatabase[shortURL].viewCount,
    uniqueVisitors: urlDatabase[shortURL].uniqueVisitors,
    visits: urlDatabase[shortURL].visits,
    date: urlDatabase[shortURL].dateCreated,
    user: users[user_id]
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const { user_id } = req.session;
  const { shortURL } = req.params;
  const templateVars = {
    user : users[user_id],
    urls: urlDatabase,
  };
  if (h.validateShortUrl(urlDatabase, shortURL)) {
    const { longURL } = urlDatabase[shortURL];
    let visitor_id = req.cookies.visitor_id;
    if (visitor_id) {
      urlDatabase[shortURL].viewCount++;
      urlDatabase[shortURL].visits.push(h.newVisit(visitor_id));
      return res.redirect(longURL);
    } else {
      urlDatabase[shortURL].viewCount++;
      urlDatabase[shortURL].uniqueVisitors++;
      visitor_id = h.generateRandomString();
      res.cookie("visitor_id", visitor_id).redirect(longURL);
      urlDatabase[shortURL].visits.push(h.newVisit(visitor_id));
    }
  } else {
    res.status(404).render("error_messages/invalid_url", templateVars);
  }
});

/////////////////////////////
//POST/PUT/DELETE endpoints//
/////////////////////////////

app.post("/urls", (req, res) => {
  const { user_id } = req.session;
  const templateVars = { user : users[user_id],};
  if (user_id) {
    const newId = h.generateRandomString();
    h.createNewUrl(urlDatabase, newId, req);
    res.redirect(`/urls/${newId}`);
  } else {
    res.status(403).render("error_messages/not_logged", templateVars);
  }
});

app.put("/urls", (req, res) => {
  const { shortURL } = req.body;
  const { longURL } = req.body;
  if (h.checkUserUrls(urlDatabase, req)) {
    urlDatabase[shortURL].longURL = longURL;
    return res.redirect(`/urls/`);
  }
  const newId = h.generateRandomString();
  h.createNewUrl(urlDatabase, newId, req);
  res.redirect(`/urls`);
});

app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const { user_id } = req.session;
  const templateVars = { user : users[user_id],};
  if (h.checkForEmail(users, email)) {
    return res.status(400).render("error_messages/duplicate_user", templateVars);
  }
  if (!email || !password) {
    return res.status(400).render("error_messages/incomplete_form", templateVars);
  }
  const newId = h.generateRandomString();
  h.createNewUser(users, newId, req);
  req.session.user_id = users[newId].id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { password } = req.body;
  const { email } = req.body;
  const { user_id } = req.session;
  const templateVars = { user : users[user_id]};
  let id = h.getUserByEmail(users, email);
  if (!id) {
    return res.status(401).render("error_messages/failed_auth", templateVars);
  }
  if (bcrypt.compareSync(password, users[id].password)) {
    req.session.user_id = id;
    return res.redirect("/urls");
  }
  res.status(401).render("error_messages/failed_auth", templateVars);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { longURL } = req.body;
  const { user_id } = req.session;
  const templateVars = { user : users[user_id],};
  if (h.checkOwnership(urlDatabase, req)) {
    urlDatabase[shortURL].longURL = h.formatUrl(longURL);
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).render("error_messages/url_not_owned", templateVars);
  }
});

app.delete("/urls/:shortURL", (req, res) => {
  const { shortURL } = req.params;
  const { user_id } = req.session;
  const templateVars = { user : users[user_id],};
  if (user_id) {
    if (h.checkOwnership(urlDatabase, req)) {
      delete urlDatabase[shortURL];
    }
    res.status(403).render("error_messages/url_not_owned", templateVars);
  } else {
    res.status(403).render("error_messages/not_logged", templateVars);
  }
});


/// Server Start

app.listen(PORT, () => {
  console.log(`TinyApp is listening on ${PORT}`);
});

