const express = require("express");
const router = express.Router();
const userControllers = require("../controllers/user");
const wrapAsync = require("../middlewares/wrapAsync");
const { authorization } = require("../middlewares/authorization");
const { uploadSingleImage } = require("../config/cloudinary");

router.get("/profile", authorization, wrapAsync(userControllers.getAuthUser));
router.put(
	"/profile",
	authorization,
	uploadSingleImage,
	wrapAsync(userControllers.updateUserProfile)
);
router.get("/users", authorization, wrapAsync(userControllers.getAllUsers));

module.exports = router;
