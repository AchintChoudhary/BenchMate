const User = require("../models/user");
const { uploadToCloudinary } = require("../config/cloudinary");

const getAuthUser = async (req, res) => {
	if (!req.user) {
		return res.status(404).json({ message: `User Not Found` });
	}
	res.status(200).json({
		data: req.user,
	});
};

const getAllUsers = async (req, res) => {
	const allUsers = await User.find({ _id: { $ne: req.user._id } })
		.select("-password")
		.sort({ _id: -1 });
	res.status(200).send({ data: allUsers });
};

const updateUserProfile = async (req, res) => {
	if (!req.user || !req.user._id) {
		return res
			.status(401)
			.json({ message: "Unauthorized: User not authenticated" });
	}

	const { firstName, lastName } = req.body;

	if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) {
		return res
			.status(400)
			.json({ message: "First name and last name are required" });
	}

	const updateData = {
		firstName: firstName.trim(),
		lastName: lastName.trim(),
	};

	// If a file was uploaded, upload it to Cloudinary
	if (req.file) {
		try {
			const cloudinaryResult = await uploadToCloudinary(req.file.buffer);
			if (!cloudinaryResult || !cloudinaryResult.secure_url) {
				return res
					.status(500)
					.json({ message: "Failed to upload image to Cloudinary" });
			}
			updateData.image = cloudinaryResult.secure_url;
		} catch (uploadError) {
			console.error("Cloudinary upload error:", uploadError);
			let errorMsg =
				uploadError.message || "Failed to upload image to Cloudinary";
			if (
				uploadError.http_code === 403 ||
				(typeof errorMsg === "string" && errorMsg.includes("403"))
			) {
				errorMsg =
					"Cloudinary upload failed (403 Forbidden): The configured Cloudinary API Key lacks 'create' (upload) permissions, or the credentials in backend/.env are invalid. Please check your Cloudinary Access Keys.";
			}
			return res.status(500).json({
				message: errorMsg,
			});
		}
	}

	const updatedUser = await User.findByIdAndUpdate(
		req.user._id,
		{ $set: updateData },
		{ returnDocument: "after", runValidators: true }
	).select("-password");

	if (!updatedUser) {
		return res.status(404).json({ message: "User not found" });
	}

	res.status(200).json({
		message: "Profile updated successfully",
		data: updatedUser,
	});
};

module.exports = { getAuthUser, getAllUsers, updateUserProfile };
