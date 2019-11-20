"use strict";

const express = require("express");
const router = express.Router();
const Course = require("../models").Course;

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
      const courses = await Course.findAll();
      res.status(200).json({
        Courses: courses.map(course => {
          return {
            id: course.id,
            title: course.title,
            description: course.description,
            estimatedTime: course.estimatedTime,
            materials: course.materialsNeeded,
            userId: course.userId
          };
        })
      });
    })
  );

router.post("courses/:id")

  module.exports = router;