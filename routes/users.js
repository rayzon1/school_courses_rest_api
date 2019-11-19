const express = require("express");
const router = express.Router();
const User = require("../models").User;

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

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.findAll();
    res.status(200).json({
      Users: users.map( user =>  {
        return {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.emailAddress,
          password: user.password
        }
      })
    });
  })
);

module.exports = router;
