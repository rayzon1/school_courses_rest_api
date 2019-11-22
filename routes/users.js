"use strict";

const express = require("express");
const router = express.Router();
const User = require("../models").User;
const bcryptjs = require("bcryptjs");
const { check, validationResult } = require("express-validator");
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

// Authentication middleware to only let signed in users access resource.
const authenticateUser = async (req, res, next) => {
  let message = null;
  // Parse the user's credentials from the Authorization header.
  const credentials = auth(req);
  if (credentials) {
    // Retrieve the user from the data store
    const users = await User.findAll();
    const user = users.find(data => data.emailAddress === credentials.name);
    if (user) {
      // Use the bcryptjs npm package to compare the user's password
      // with the user's password in the store.
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        user.password
      );
      if (authenticated) {
        // Store the retrieved user object on the request object.
        req.currentUser = user;
      } else {
        message = `Authentication failure for username: ${user.emailAddress}`;
      }
    } else {
      message = `Authentication failure for username: ${user.emailAddress}`;
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
    // If user authentication succeeded...
    // Call the next() method.
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
  [
    check("firstName")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide ax first name."),
    check("lastName")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a last name."),
    check("emailAddress")
      .exists({ checkNull: true, checkFalsy: true })
      .isEmail()
      .withMessage("Please provide a valid email address."),
    check("password")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a password.")
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ error: errorMessages });
    }

    try {
      const user = req.body;
      user.password = bcryptjs.hashSync(user.password);
      await User.create(req.body);
      res
        .sendStatus(201)
        .redirect("/")
        .end();
    } catch (error) {
      res.json({ error: error.msg });
    }
  })
);

module.exports = router;
