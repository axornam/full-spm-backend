const mongoose = require("mongoose");

const projectSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  author: {
    // type: mongoose.Schema.Types.ObjectId,
    // ref: "User",
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  introduction: {
    type: String,
    default: "",
  },
  abstract: {
    type: String,
    default: "",
  },
  document: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  images: [
    {
      type: String,
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

projectSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

projectSchema.set("toJSON", {
  virtuals: true,
});

exports.Project = mongoose.model("Project", projectSchema);
