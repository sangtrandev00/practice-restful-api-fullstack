const { validationResult } = require("express-validator");
const fileHelper = require("../util/file");
const Post = require("../models/post");
const io = require("../socket");
const User = require("../models/user");

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;

  let totalItems;

  // Transform to async await

  try {
    totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({
        createdAt: -1,
      })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    // console.log("posts: ", posts);

    res.status(200).json({
      message: "Fetched posts successfully!",
      posts: posts,
      totalItems: totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  // Post.find()
  //   .countDocuments()
  //   .then((count) => {
  //     totalItems = count;

  //     return Post.find()
  //       .skip((currentPage - 1) * perPage)
  //       .limit(perPage);
  //   })
  //   .then((posts) => {
  //     res.status(200).json({
  //       message: "Fetched posts successfully!",
  //       posts: posts,
  //       totalItems: totalItems,
  //     });
  //   })
  //   .catch((err) => {
  //     if (!err.statusCode) {
  //       err.statusCode = 500;
  //     }
  //     next(err);
  //   });
};

exports.createPost = (req, res, next) => {
  // create a post in database
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect!");
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error("No image provided.");
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\", "/");
  // console.log("imageUrl: ", req.file);
  const title = req.body.title;
  const content = req.body.content;
  let creator;
  const post = new Post({
    title: title,
    content: content,
    creator: req.userId,
    imageUrl: imageUrl,
  });
  post
    .save()
    .then((result) => {
      // createdPost = result;
      return User.findById(req.userId);
    })
    .then((user) => {
      creator = user;
      user.posts.push(post);
      return user.save();
    })
    .then((result) => {
      io.getIO().emit("posts", {
        action: "create",
        post: {
          ...post._doc,
          creator: {
            _id: req.userId,
            name: result.name,
          },
        },
      });

      res.status(201).json({
        message: "POST created successfully!",
        post: post,
        creator: {
          _id: creator._id,
          name: creator.name,
        },
      });
    })
    .catch((err) => {
      // console.log(err);
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;

  Post.findOne({
    _id: postId,
  })
    .then((post) => {
      if (!post) {
        const error = new Error("Could not find post.");

        error.statusCode = 404;

        throw error;
      }

      res.status(200).json({
        message: "Get single post successfully!",
        post: post,
      });
    })
    .then((err) => {
      // if (!err.statusCode) {
      //   err.statusCode = 500;
      // }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;

  const errors = validationResult(req);

  // console.log("req.file: ", req.file);

  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect!");
    error.statusCode = 422;
    throw error;
  }

  const { title: updatedTitle, content: updatedContent } = req.body;
  let imageUrl = req.body.image;

  if (req.file) {
    imageUrl = req.file.path.replace("\\", "/");
  }

  if (!imageUrl) {
    const error = new Error("No file picked.");
    error.statusCode = 422;
    throw error;
  }

  Post.findById(postId)
    .populate("creator")
    .then((post) => {
      if (!post) {
        const error = new Error("Cound not find post!");
        error.statusCode = 404;
        throw error;
      }

      console.log("imageUrl: ", imageUrl);
      console.log("old image: ", post.imageUrl);

      console.log("post.creator: ", post.creator);
      console.log("req.userid: ", req.userId);

      if (post.creator._id.toString() !== req.userId) {
        const error = new Error("Not authorized");
        error.statusCode = 401;

        throw error;
      }

      if (imageUrl !== post.imageUrl) {
        // imageUrl = image.path.replace("\\", "/"); -- Updated go wrong here!! -- wrong at logic !!!
        console.log("deleted image!", post.imageUrl);

        fileHelper.deleteFile(post.imageUrl);
      }

      post.title = updatedTitle;
      post.content = updatedContent;
      post.imageUrl = imageUrl;

      return post.save().then((result) => {
        // Create connection websocket.io

        io.getIO().emit("posts", {
          action: "update",
          post: result,
        });

        res.status(200).json({
          message: "Updated post successfully!",
          post: result,
        });

        //Updated: --
      });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;

  console.log("post: ", postId);

  let foundPost;

  try {
    const post = await Post.findById(postId);
    foundPost = post;
    if (post.creator.toString() !== req.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 401;

      throw error;
    }
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }

  Post.deleteOne({ _id: postId })
    .then((result) => {
      // Check if any document was deleted
      if (result.deletedCount === 0) {
        throw new Error("Post not found.");
      }

      // console.log("deleted ", post.imageUrl);
      fileHelper.deleteFile(foundPost.imageUrl);
      return User.findById(req.userId);
    })
    .then((user) => {
      user.posts.pull(postId);

      return user.save(); // Phải có save nhỉ. Nếu không có save thì sao ???
    })
    .then((result) => {
      // Add websocket here

      io.getIO().emit("posts", {
        action: "delete",
        post: {
          ...foundPost._doc,
          creator: {
            _id: req.userId,
            name: result.name,
          },
        },
      });

      res.status(200).json({ message: "Post deleted successfully." });
    })
    .catch((err) => {
      // Handle any errors
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
