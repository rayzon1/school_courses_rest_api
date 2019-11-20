"use strict";

const express = require("express");
const router = express.Router();
const User = require("../models").User;
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");

/* Handler function to wrap each route. */
function asyncHandler(cb) {
  return async (req, res, next) => {
    try {
      await cb(req, res, next);
    } catch (error) {
      res.status(500).send(error);
    }
  };
}

const authenticateUser = async (req, res, next) => {
  let message = null;
  // Parse the user's credentials from the Authorization header.
  const credentials = auth(req);

  // If the user's credentials are available...
  if (credentials) {
    // If a user was successfully retrieved from the data store...

    const users = await User.findAll();
    const userEmails = users.map(user => user.emailAddress);
    const user = userEmails.find(u => u === credentials.username);
    
    console.log(user);
    if (user) {
      const authenticated = bcryptjs.compareSync(
        credentials.password,
        user.password
      );
      // If the passwords match...
      if (authenticated) {
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.username}`;
      }
    } else {
      message = `Authentication failure for username: ${user.username}`;
    }
  } else {
    message = "Auth header not found";
  }

  // If user authentication failed...
  if (message) {
    console.warn(message);
    // Return a response with a 401 Unauthorized HTTP status code.
    res.status(401).json({ message: "Access Denied" });
  } else {
    next();
  }
};

// Get route to get all users in database.
router.get(
  "/users",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const users = await User.findAll();

    res.status(200).json({
      Users: users.map(user => {
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.emailAddress,
          password: user.password
        };
      })
    });
  })
);

// Post route to create a user.
router.post(
  "/users",
  asyncHandler(async (req, res) => {
    try {
      const user = req.body;
      user.password = bcryptjs.hashSync(user.password);
      await User.create(req.body);
      res.sendStatus(201).end();
    } catch (error) {
      res.json({ error: error.msg });
    }
  })
);

module.exports = router;
