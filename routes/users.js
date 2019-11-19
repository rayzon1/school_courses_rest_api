const express = require('express');
const router = express.Router();
const User = require('../models').User;

/* Handler function to wrap each route. */
function asyncHandler(cb){
    return async(req, res, next) => {
      try {
        await cb(req, res, next)
      } catch(error){
        res.status(500).send(error);
      }
    }
  }

  router.get('/', asyncHandler(async (req, res) => {
    const users = await User.findAll();
    res.status(200).json({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.emailAddress,
    });
   
  }));

  module.exports = router;