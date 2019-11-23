const User = require("../../models").User;
const bcryptjs = require("bcryptjs");
const auth = require("basic-auth");

const authenticateUser = async (req, res, next) => {
    let message = null;
    // Parse the user's credentials from the Authorization header.
    const credentials = auth(req);
    // If the user's credentials are available...
    if (credentials) {
      // Attempt to retrieve the user from the data store
      const users = await User.findAll();
      const user = users.find(data => data.emailAddress === credentials.name);
      // If a user was successfully retrieved from the data store...
      if (user) {
        // Use the bcryptjs npm package to compare the user's password
        // to the users password from the data store.
        const authenticated = bcryptjs.compareSync(
          credentials.pass,
          user.password
        );
        // If the passwords match...
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
        message = 'Auth header not found';
    }
  
    // If user authentication failed...
    if(message) {
      console.warn(message);
      // Return a response with a 401 Unauthorized HTTP status code.
      res.status(401).json({ message: 'Access Denied' });
    } else {
      // Or if user authentication succeeded.
      next();
    }
    
  };

  module.exports = authenticateUser;