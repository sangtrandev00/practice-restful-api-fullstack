const mongoose = require("mongoose"); // Erase if already required
const Schema = mongoose.Schema;
// Declare the Schema of the Mongo model

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      // required: true,
      default: "I am new!!!",
    },
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  {
    timestamps: true, //Create at, update at automatically insert
  }
);

//Export the model
module.exports = mongoose.model("User", userSchema);
