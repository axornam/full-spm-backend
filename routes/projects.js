const { Project } = require("../models/project");
const express = require("express");
const { Category } = require("../models/category");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
};

// multer upload configuration with  associated images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid document type");

    if (isValid) {
      uploadError = null;

      if (file.fieldname === "document") {
        cb(uploadError, "public/uploads/docs");
      } else if (file.fieldname === "image") {
        cb(uploadError, "public/uploads");
      }
    }
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE_MAP[file.mimetype];
    // const fileName = file.originalname.split(" ").join("-");
    const fileName = file.originalname.split(".")[0].split(" ").join("-");
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const filter = (req, file, cb) => {
  if (file.fieldname === "document") {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/epub+zip"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  } else if (file.fieldname === "image") {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
};

const uploadOptions = multer({ storage: storage, fileFilter: filter });

// GET route to retrieve all projects from the database
router.get(`/`, async (req, res) => {
  let filter = {};
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  // const projectList = await Project.find(filter);
  const projectList = await Project.find(filter).populate("category");

  if (!projectList) {
    res.status(500).json({ success: false });
  }
  res.send(projectList);
});

// GET route to retreive a project with and associated :id
router.get(`/:id`, async (req, res) => {
  const project = await Project.findById(req.params.id).populate("category");

  if (!project) {
    res.status(500).json({ success: false });
  }
  res.send(project);
});

// POST route to upload new projects with associated images to the database
// router.post(`/`, uploadOptions.single("image"), async (req, res) => {
router.post(
  `/`,
  uploadOptions.fields([
    { name: "image", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  async (req, res) => {
    const category = await Category.findById(req.body.category);
    if (!category) return res.status(400).send("Invalid Category");

    // const author = await User.findById(req.body.author);
    // if (!author) return res.status(400).send("Author does not exist");

    const file = req.files ? req.files : req.file;
    if (!file) return res.status(400).send("No image in the request");
    const fileLength = Object.keys(file).length;

    let imageFileName;
    let documentFileName;

    if (file.document) {
      documentFileName = file.document[0].filename;
    }

    if (file.image) {
      imageFileName = file.image[0].filename;
    }

    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    let project = new Project({
      name: req.body.name,
      description: req.body.description,
      introduction: req.body.introduction,
      author: req.body.author,
      abstract: req.body.abstract,
      image: imageFileName ? `${basePath}${imageFileName}` : "", // "http://localhost:3000/public/upload/image-2323232"
      document: documentFileName ? `${basePath}docs/${documentFileName}` : "", // "http://localhost:3000/public/upload/docs/doc-2323232"
      category: req.body.category,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
      // FIXME add document/pdf body parameter
    });

    project = await project.save();

    if (!project) return res.status(500).send("The project cannot be created");

    res.send(project);
  }
);

// PUT route to update an existing project with associated :id
router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).send("Invalid Project Id");
  }
  const category = await Category.findById(req.body.category);
  if (!category) return res.status(400).send("Invalid Category");

  const project = await Project.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      introduction: req.body.introduction,
      abstract: req.body.abstract,
      image: req.body.image,
      document: req.body.document,
      category: req.body.category,
      rating: req.body.rating,
      numReviews: req.body.numReviews,
      isFeatured: req.body.isFeatured,
      // FIXME add document/pdf body parameter
    },
    { new: true }
  );

  if (!project) return res.status(500).send("the project cannot be updated!");

  // return the updated project
  res.send(project);
});

// DELETE route to removing a project with the associated :id from the database
router.delete("/:id", (req, res) => {
  Project.findByIdAndRemove(req.params.id)
    .then((project) => {
      if (project) {
        return res
          .status(200)
          .json({ success: true, message: "the project is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "project not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

// GET route to retrieve the number of existing projects
router.get(`/get/count`, async (req, res) => {
  const projectCount = await Project.countDocuments((count) => count);

  if (!projectCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    projectCount: projectCount,
  });
});

// GET route for retrieving number of existing featured projects counts
router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const projects = await Project.find({ isFeatured: true }).limit(+count);

  if (!projects) {
    res.status(500).json({ success: false });
  }
  res.send(projects);
});

// PUT route for updating images/images of an existing project with associated :id
router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Project Id");
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    if (files) {
      files.map((file) => {
        imagesPaths.push(`${basePath}${file.filename}`);
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!project) return res.status(500).send("the gallery cannot be updated!");

    res.send(project);
  }
);

module.exports = router;
