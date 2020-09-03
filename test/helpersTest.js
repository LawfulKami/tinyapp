/* eslint-disable camelcase */
const { assert } = require('chai');

const h = require('../helpers.js');

const testUsers = {
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

const testUrlDatabase = {
  "b2xVn2": { longURL :"http://www.lighthouselabs.ca", userId: "userRandomID" },
  "9sm5xK": { longURL :"http://www.google.com", userId: "user2RandomID" }
};

const sampleReq = {
  body: {
    longURL: "www.testLongUrl.com",
    shortURL: "t3sTsU"
  },
  session: { user_id : "testUserID" }
};



describe('getUserByEmail', function() {

  it('should return a user with valid email', function() {
    const user = h.getUserByEmail(testUsers, "user@example.com");
    return assert.equal(user, "userRandomID");
  });

  it('should return a user with undefined', function() {
    const user = h.getUserByEmail(testUsers, "Blabla");
    return assert.equal(user, "");
  });
});

describe('generateRandomString', function() {

  it('should return a random 6 length string', function() {
    const string = h.generateRandomString();
    return assert.equal(6, string.length);
  });

});

describe('urlsForUser', function() {

  it('should return an object with only the urls of the user', function() {
    const object = h.urlsForUser(testUrlDatabase, "userRandomID");
    return assert.deepEqual(object, {
      "b2xVn2": {
        longURL :"http://www.lighthouselabs.ca",
        userId: "userRandomID" }
    });
  });

  it('should return an  empty object if user own noe URLs', function() {
    const object = h.urlsForUser(testUrlDatabase, "dfgdf");
    return assert.deepEqual(object, {});
  });

});

describe('createNewUrl', function() {

  it('should return an the id fed to it', function() {
    const id = h.createNewUrl(testUrlDatabase, "NewTestId", sampleReq);
    return assert.equal(id, "NewTestId");
  });

  it('should have modified the Db adding new URL', function() {
    h.createNewUrl(testUrlDatabase, "NewTestId", sampleReq);
    return assert.deepEqual(testUrlDatabase, {
      "NewTestId": { longURL: "http://www.testLongUrl.com", userId: "testUserID"},
      "b2xVn2": { longURL :"http://www.lighthouselabs.ca", userId: "userRandomID" },
      "9sm5xK": { longURL :"http://www.google.com", userId: "user2RandomID" }
    });
  });


});