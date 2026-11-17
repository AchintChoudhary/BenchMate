const User = require("../models/user");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const { generateToken } = require("../config/jwtProvider");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const registerUser = async (req, res) => {
	let { firstName, lastName, email, password } = req.body;
	if (!firstName || !lastName || !email || !password) {
		return res.status(400).json({ message: "All fields are required" });
	}
	const normalizedEmail = email.trim().toLowerCase();
	const existingUser = await User.findOne({
		email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i") },
	});
	if (existingUser) {
		return res.status(400).json({ message: `User Already Exist` });
	}
	password = bcrypt.hashSync(password, 8);
	const userData = new User({
		firstName: firstName.trim(),
		lastName: lastName.trim(),
		email: normalizedEmail,
		password,
		authProvider: "local",
	});
	const user = await userData.save();
	const jwt = generateToken(user._id);
	res.status(200).json({
		message: "Registration Successfully",
		token: jwt,
	});
};

const loginUser = async (req, res) => {
	let { email, password } = req.body;
	if (!email || !password) {
		return res.status(400).json({ message: "Email and password are required" });
	}
	const normalizedEmail = email.trim().toLowerCase();
	let user = await User.findOne({
		email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i") },
	});
	if (!user) {
		return res.status(404).json({ message: `User Not Found` });
	}
	if (!user.password) {
		return res.status(400).json({
			message:
				"This account uses Google Sign-In. Please continue with Google.",
		});
	}
	const isPasswordValid = bcrypt.compareSync(password, user.password);
	if (!isPasswordValid) {
		return res.status(401).json({ message: "Invalid Password" });
	}
	const jwt = generateToken(user._id);
	const userResponse = user.toObject();
	delete userResponse.password;
	res.status(200).json({
		message: "Login Successfully",
		data: userResponse,
		token: jwt,
	});
};

const googleAuth = async (req, res) => {
	const idToken = req.body?.credential || req.body?.idToken;
	if (!idToken) {
		return res.status(400).json({ message: "Google ID token is required" });
	}

	const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
	if (!googleClientId || googleClientId === "YOUR_GOOGLE_CLIENT_ID") {
		return res.status(500).json({
			message: "Google authentication is not configured on the server",
		});
	}
	if (googleClientId.startsWith("GOCSPX-")) {
		return res.status(500).json({
			message:
				"Invalid GOOGLE_CLIENT_ID: a Client Secret (GOCSPX-...) was provided instead of a Google OAuth Client ID (.apps.googleusercontent.com)",
		});
	}

	const client = new OAuth2Client(googleClientId);
	let ticket;
	try {
		ticket = await client.verifyIdToken({
			idToken,
			audience: googleClientId,
		});
	} catch (err) {
		console.error("Google token verification failed:", err.message);
		return res.status(401).json({ message: "Invalid or expired Google token" });
	}

	const payload = ticket.getPayload();
	if (!payload || !payload.email || !payload.email_verified) {
		return res.status(401).json({
			message: "Google account email is not verified",
		});
	}

	const normalizedEmail = payload.email.trim().toLowerCase();
	let user = await User.findOne({
		$or: [
			{ googleId: payload.sub },
			{ email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, "i") } },
		],
	});

	if (user) {
		let shouldSave = false;
		if (!user.googleId) {
			user.googleId = payload.sub;
			shouldSave = true;
		}
		if (!user.image && payload.picture) {
			user.image = payload.picture;
			shouldSave = true;
		}
		if (shouldSave) {
			await user.save();
		}
	} else {
		const fullName = (payload.name || "").trim();
		const nameParts = fullName ? fullName.split(/\s+/) : [];
		const firstName = (
			payload.given_name ||
			nameParts[0] ||
			normalizedEmail.split("@")[0]
		).trim();
		const lastName = (
			payload.family_name ||
			(nameParts.length > 1 ? nameParts.slice(1).join(" ") : "")
		).trim();

		user = await User.create({
			firstName,
			lastName,
			email: normalizedEmail,
			googleId: payload.sub,
			authProvider: "google",
			image: payload.picture || "",
		});
	}

	const jwt = generateToken(user._id);
	const userResponse = user.toObject();
	delete userResponse.password;

	return res.status(200).json({
		message: "Login Successfully",
		data: userResponse,
		token: jwt,
	});
};

module.exports = { registerUser, loginUser, googleAuth };
