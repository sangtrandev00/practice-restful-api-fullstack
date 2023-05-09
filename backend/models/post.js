const mongoose = require("mongoose"); // Erase if already required
const Schema = mongoose.Schema;
// Declare the Schema of the Mongo model

const postSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, //Create at, update at automatically insert
  }
);

//Export the model
module.exports = mongoose.model("Post", postSchema);
