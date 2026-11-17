const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true,
		},
		lastName: {
			type: String,
			required: function () {
				return this.authProvider !== "google";
			},
			default: "",
			trim: true,
		},
		password: {
			type: String,
			required: function () {
				return this.authProvider !== "google";
			},
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		image: {
			type: String,
			default: "",
		},
		googleId: {
			type: String,
			unique: true,
			sparse: true,
		},
		authProvider: {
			type: String,
			enum: ["local", "google"],
			default: "local",
		},
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model("User", userSchema);
module.exports = User;
