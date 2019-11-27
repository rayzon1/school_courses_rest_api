"use strict";

const express = require("express");
const router = express.Router();
const Course = require("../models").Course;
const User = require("../models").User;
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
    const courses = await Course.findAll({
      include: {
        model: User,
        as: "user",
        attributes: { exclude: ["password", "createdAt", "updatedAt"] }
      },
      attributes: { exclude: ["createdAt", "updatedAt"] }
    });
    res.status(200).json(courses);
  })
);

// Get route for specific course id.
router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    try {
      const course = await Course.findByPk(req.params.id, {
        include: {
          model: User,
          as: "user",
          attributes: { exclude: ["password", "createdAt", "updatedAt"] }
        },
        attributes: { exclude: ["createdAt", "updatedAt"] }
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

// Post a new article and set Location header to show added article.
//! Authentication needed.
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
//! Authentication needed.
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
    // Find course by params id.
    const course = await Course.findByPk(req.params.id);

    // Returns 403 Forbidden if the currentUser id does not match the course owners id.
    if (req.currentUser.id !== course.userId) {
      return res.sendStatus(403);
    }

    // Validation errors sends 400 response.
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ error: errorMessages });
    }

    // If course available and passes validation/auth tests.
    if (course) {
      await course.update(req.body);
      res.sendStatus(204);
    } else {
      res.sendStatus(404);
    }
  })
);

// Delete course by courseId.
//! Authentication needed.
router.delete(
  "/courses/:id",
  authenticateUser,
  asyncHandler(async (req, res) => {

    const course = await Course.findByPk(req.params.id);

    if (req.currentUser.id !== course.userId){
      return res.sendStatus(403);
    } else if (course) {
      await course.destroy();
      return res.sendStatus(204);
    } else {
      return res.sendStatus(404);
    }
  })
);

module.exports = router;
