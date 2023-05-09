const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed");

    error.statusCode = 422;
    error.data = errors.array();

    throw error;
  }

  const { email, name, password } = req.body;

  bcrypt
    .hash(password, 12)
    .then((hashedPassword) => {
      const newUser = new User({
        email,
        name,
        password: hashedPassword,
      });

      return newUser.save();
    })
    .then((result) => {
      res.status(201).json({
        message: "User created",
        userId: result._id,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  User.findOne({
    email: email,
  })
    .then((userDoc) => {
      if (!userDoc) {
        const error = new Error("Could not find user by email!");
        error.statusCode = 401;
        throw error;
      }

      bcrypt
        .compare(password, userDoc.password)
        .then((doMatch) => {
          console.log(doMatch);

          if (!doMatch) {
            throw new Error("Password wrong!!!");
          }

          // Create json web token ???

          const token = jwt.sign(
            { email: userDoc.email, userId: userDoc._id.toString() },
            "somesupersecret",
            { expiresIn: "1h" }
          );

          res.status(200).json({
            message: "Login successfully!",
            token: token,
            userId: userDoc._id.toString(),
          });
        })
        .catch((err) => {
          if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
        });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getUserStatus = (req, res, next) => {
  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      res.status(200).json({
        status: user.status,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateUserStatus = (req, res, next) => {
  const { status } = req.body;

  console.log("status: ", status);

  User.findById(req.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
      }

      user.status = status;
      return user.save();
    })
    .then((result) => {
      res.status(200).json({
        message: "Update user successfully!",
        user: result,
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
