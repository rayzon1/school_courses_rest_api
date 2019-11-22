"use strict";

const express = require("express");
const router = express.Router();
const Course = require("../models").Course;
const { check, validationResult } = require("express-validator");
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

  if (credentials) {
    // Retrieve the user from the data store
    const courses = await Course.findAll();
    const course = courses.find(data => data.emailAddress === credentials.name);

    if (course) {
      // Use the bcryptjs npm package to compare the user's password
      // with the user's password in the store.
      const authenticated = bcryptjs.compareSync(
        credentials.pass,
        course.password
      );

      if (authenticated) {
        // Store the retrieved user object on the request object.
        req.currentCourse = course;
      } else {
        message = `Authentication failure for username: ${course.emailAddress}`;
      }
    } else {
      message = `Authentication failure for username: ${course.emailAddress}`;
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

// Get route to get all courses in the database.
router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const courses = await Course.findAll({ include: ["user"] });
    res.status(200).json(courses);
  })
);

// Get route for specific course id.
router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    try {
      const course = await Course.findByPk(req.params.id, {
        include: ["user"]
      });
      if (course) {
        res.json(course);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      res.json({ error: error.msg });
    }
  })
);

// Post a new article and redirect to show added article.
router.post(
  "/courses",
  [
    check("title")
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for title'),
    check("description")
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for description.'),
  ],
  authenticateUser,
  asyncHandler(async (req, res) => {

    // Validation errors sends 400 response.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ error: errorMessages });
    }

    try {
      const course = req.body;
      Course.create(course).then(data => {
        res
          .status(201)
          .set("Location", "http://localhost:5000/api/courses/" + data.id)
          .end();
      });
    } catch (error) {
        res.json({ error: error.msg });
    }
  })
);

// Update an article by id.
router.put(
  "/courses/:id",
  [
    check("title")
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for title'),
    check("title")
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for description.'),
  ],
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);

    // Validation errors sends 400 response.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ error: errorMessages });
    }

    if (course) {
      await course.update(req.body);
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  })
);

router.delete("/courses/:id", asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if (course) {
        await course.destroy();
        res.sendStatus(204);
    } else {
        res.sendStatus(404);
    }
}))

module.exports = router;
