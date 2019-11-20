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