const { getUserIdFromToken } = require("../config/jwtProvider");
const User = require("../models/user");
const wrapAsync = require("./wrapAsync");

const authorization = wrapAsync(async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Unauthorized: Token not found" });
	}
	const token = authHeader.split(" ")[1];
	if (!token) {
		return res
			.status(401)
			.json({ message: "Unauthorized: Token not provided" });
	}
	let userId;
	try {
		userId = getUserIdFromToken(token);
	} catch (err) {
		return res
			.status(401)
			.json({ message: "Unauthorized: Invalid or expired token" });
	}
	if (!userId) {
		return res
			.status(401)
			.json({ message: "Unauthorized: Invalid token payload" });
	}
	const user = await User.findById(userId).select("-password");
	if (!user) {
		return res
			.status(401)
			.json({ message: "Unauthorized: User not found" });
	}
	req.user = user;
	next();
});

module.exports = { authorization };
