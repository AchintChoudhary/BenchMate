const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	secure: true,
});

// Multer memory storage configuration (avoids saving to local disk)
const storage = multer.memoryStorage();

// Allowed image MIME types: JPG, JPEG, PNG, and WEBP
const fileFilter = (req, file, cb) => {
	const allowedMimeTypes = [
		"image/jpeg",
		"image/jpg",
		"image/png",
		"image/webp",
	];
	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(
				"Invalid file type. Only JPG, JPEG, PNG, and WEBP formats are allowed."
			),
			false
		);
	}
};

const upload = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5 MB maximum
	},
	fileFilter,
});

// Middleware to handle single image upload with error handling
const uploadSingleImage = (req, res, next) => {
	upload.single("image")(req, res, (err) => {
		if (err instanceof multer.MulterError) {
			if (err.code === "LIMIT_FILE_SIZE") {
				return res
					.status(400)
					.json({ message: "Image size must not exceed 5 MB." });
			}
			return res.status(400).json({ message: err.message });
		} else if (err) {
			return res.status(400).json({ message: err.message });
		}
		next();
	});
};

// Helper function to stream memory buffer to Cloudinary
const uploadToCloudinary = (fileBuffer, folder = "benchmate/profiles") => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder: folder,
				resource_type: "image",
			},
			(error, result) => {
				if (error) {
					return reject(error);
				}
				resolve(result);
			}
		);
		uploadStream.end(fileBuffer);
	});
};

module.exports = {
	cloudinary,
	upload,
	uploadSingleImage,
	uploadToCloudinary,
};
