/* eslint-disable camelcase */
const bcrypt = require("bcrypt");

const generateRandomString = () => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * 62));
  }
  return result;
};

const checkForEmail = (users, email) => {
  for (const user in users) {
    const existingEmail = users[user].email;
    if (existingEmail === email) {
      return true;
    }
  }
  return false;
};

const urlsForUser = (database, id) => {
  const filteredData = {};
  for (const url in database) {
    if (database[url].userId === id) {
      filteredData[url] = database[url];
    }
  }
  return filteredData;
};

const createNewUrl = (database, id, req) => {
  database[id] = {};
  if (req.body.longURL.match(/^(https:\/\/|http:\/\/)/)) {
    database[id].longURL = req.body.longURL;
    database[id].userId = req.session.user_id;
    database[id].viewCount = 0;
    database[id].uniqueVisitors = 0;
    database[id].visits =  [];
  } else {
    database[id].longURL = "http://" + req.body.longURL;
    database[id].userId = req.session.user_id;
    database[id].viewCount = 0;
    database[id].uniqueVisitors = 0;
    database[id].visits =  [];
  }
};

const checkUserUrls = (database, req) => {
  const userUrls = urlsForUser(database, req.session.user_id);
  return Object.keys(userUrls).includes(req.body.shortURL);
};

const createNewUser = (users, id, req) => {
  users[id] = {};
  users[id].password = bcrypt.hashSync(req.body.password, 10);
  users[id].email = req.body.email;
  users[id].id = id;
};

const getUserByEmail = (users, email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user].id;
    }
  }
  return "";
};

const formatUrl = (url) => {
  if (url.match(/^(https:\/\/|http:\/\/)/)) {
    return url;
  }
  return "http://" + url;
};

const checkOwnership = (database, req) => {
  const { user_id } = req.session;
  const { shortURL} = req.params;
  return user_id === database[shortURL].userId;
};

const validateShortUrl = (database, shortUrl) => {
  return Object.keys(database).includes(shortUrl);
};

const newVisit = (visitor_id) => {
  const visit = {};
  visit.visitor = visitor_id;
  visit.time = new Date();
  return visit;
};

module.exports = {
  generateRandomString,
  checkForEmail,
  urlsForUser,
  createNewUrl,
  checkUserUrls,
  createNewUser,
  getUserByEmail,
  formatUrl,
  checkOwnership,
  validateShortUrl,
  newVisit
};