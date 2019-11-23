"use strict";

const express = require("express");
const router = express.Router();
const Course = require("../models").Course;
const { check, validationResult } = require("express-validator");
const authenticateUser = require("./middleware/authentication");

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
      .withMessage("Please provide a value for title"),
    check("description")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for description.")
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
      .withMessage("Please provide a value for title"),
    check("title")
      .exists({ checkNull: true, checkFalsy: true })
      .withMessage("Please provide a value for description.")
  ],
  authenticateUser,
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

router.delete(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {
    const course = await Course.findByPk(req.params.id);
    if (course) {
      await course.destroy();
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  })
);

module.exports = router;
