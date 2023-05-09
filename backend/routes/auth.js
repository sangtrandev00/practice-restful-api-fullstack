const express = require("express");
const isAuth = require("../middleware/is-auth");
const authController = require("../controllers/auth");

const { check, body } = require("express-validator");

const User = require("../models/user");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email")
      .isEmail()
      .withMessage("Please enter a valid email.")
      .custom((value, { req }) => {
        return User.findOne({
          email: value,
        }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Email address already exist");
          }
        });
      })
      .normalizeEmail(),
    body("password", "Please enter at least five characters long!").trim().isLength({ min: 5 }),
    body("name", "Please do not let the value empty!").trim().not().isEmpty(),
  ],
  authController.signup
);

router.post("/login", authController.login);

router.get("/status", isAuth, authController.getUserStatus);
router.patch("/status", isAuth, authController.updateUserStatus);
module.exports = router;
