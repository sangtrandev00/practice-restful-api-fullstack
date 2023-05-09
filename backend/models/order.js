const mongoose = require("mongoose"); // Erase if already required
const Schema = mongoose.Schema;
// Declare the Schema of the Mongo model

const orderSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    creator: {
      type: Object,
      required: true,
    },
  },
  {
    timestamps: true, //Create at, update at automatically insert
  }
);

//Export the model
module.exports = mongoose.model("User", orderSchema);
