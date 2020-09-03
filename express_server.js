//Utilities
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require("bcrypt");

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieSession({
  name: 'session',
  keys: ["not comfortable with all whose secrets"]
}));



//"database" and helper function
const generateRandomString = () => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
};

const checkForEmail = (email) => {
  for (const user in users) {
    const existingEmail = users[user].email;
    if (existingEmail === email) {
      return true;
    }
  }
  return false;
};



const urlsForUser = (id) => {
  const filteredData = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userId === id) {
      filteredData[url] = urlDatabase[url];
    }
  }
  return filteredData;
};

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
///GET endpoints
app.get("/urls", (req, res) => {
  const userURLS = urlsForUser(req.session.user_id);
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
  if (Object.keys(urlDatabase).includes(shortURL)) {
    res.redirect(longURL);
  } else {
    res.redirect("/urls", templateVars);
  }
});

//tested
app.get("/urls/:shortURL", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id);
  if (!Object.keys(userUrls).includes(req.params.shortURL)) {
    return res.redirect("/urls");
  }
  let templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user : users[req.session.user_id]
  };
  res.render("urls_show", templateVars);
});

///POST endpoints

app.post("/urls", (req, res) => {
  const userUrls = urlsForUser(req.session.user_id);
  if (Object.keys(userUrls).includes(req.body.shortURL)) {
    urlDatabase[req.body.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${req.body.longURL}`);
  } else {
    const id = generateRandomString();
    urlDatabase[id] = {};
    if (req.body.longURL.match(/^(https:\/\/|http:\/\/)/)) {
      urlDatabase[id].longURL = req.body.longURL;
      urlDatabase[id].userId = req.session.user_id;
    } else {
      urlDatabase[id].longURL = "http://" + req.body.longURL;
      urlDatabase[id].userId = req.session.user_id;
    }
    res.redirect(`/urls/${id}`);
  }
});

app.post("/register", (req,res) => {
  if (checkForEmail(req.body.email) || !req.body.email) {
    res.status(400).end();
  }
  const newId = generateRandomString();
  users[newId] = {};
  users[newId].password = bcrypt.hashSync(req.body.password, 10);
  users[newId].email = req.body.email;
  users[newId].id = newId;
  // eslint-disable-next-line camelcase
  req.session.user_id = users[newId].id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  let id = "";
  for (const user in users) {
    if (users[user].email === email) {
      id = users[user].id;
    }
  }
  
  if (!users[id]) {
    return res.status(403).send("No such user");

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
  if (req.session.user_is === urlDatabase[req.params.shortURL].userId) {
    if (req.body.longURL.match(/^(https:\/\/|http:\/\/)/)) {
      urlDatabase[id] = req.body.longURL;
    } else {
      urlDatabase[id] = "http://" + req.body.longURL;
    }
    res.redirect(`/urls/${id}`);
  } else {
    res.redirect("/urls");
  }
});

//tested
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.session.user_id === urlDatabase[req.params.shortURL].userId) {
    delete urlDatabase[req.params.shortURL];
  }
  res.redirect("/urls");
});


/// Server Start

app.listen(PORT, () => {
  console.log(`TinyApp is listening on ${PORT}`);
});

