import express from "express";
import { nanoid } from "nanoid";
import QRCode from "qrcode";
import URL from "../Models/urlModel.mjs";
import { isAuthenticated } from "../Controllers/auth.mjs";

const router = express.Router();

// Logged-in users (protected)
router.post("/shorten/auth", isAuthenticated, async (req, res) => {
	const { originalUrl } = req.body;
	if (!originalUrl || originalUrl.trim() === "") {
		return res.status(400).json({ err: "URL is required" });
	}
	const alreadyExist = await URL.findOne({
		originalUrl,
		owner: req.user.email,
	});
	if (alreadyExist) {
		return res.json({
			msg: "URL already shortened",
			shortUrl: alreadyExist.shortUrl,
			qrCode: alreadyExist.qrCode,
		});
	}
	const shortUrl = nanoid(7);
	try {
		// Generate QR code
		const qrCode = await QRCode.toDataURL(
			`http://localhost:3000/url/${shortUrl}`
		);

		const newUrl = await URL.create({
			originalUrl,
			shortUrl,
			owner: req.user.email,
			qrCode,
		});

		res.json({
			msg: "Short URL created successfully!",
			shortUrl,
			qrCode,
		});
	} catch (err) {
		if (err.code === 11000) {
			return res
				.status(400)
				.json({ err: "Alias already taken. Please choose another." });
		}
		res.status(500).json({ err: "Server error" });
	}
});

// Create short URL
router.post("/shorten", async (req, res) => {
	const { originalUrl } = req.body;
	if (!originalUrl || originalUrl.trim() === "") {
		return res.status(400).json({ err: "URL is required" });
	}
	const alreadyExist = await URL.findOne({ originalUrl });
	if (alreadyExist) {
		const qrCode = await QRCode.toDataURL(
			`http://localhost:3000/url/${alreadyExist.shortUrl}`
		);
		return res.json({
			msg: "URL already shortened",
			shortUrl: alreadyExist.shortUrl,
			qrCode,
		});
	}
	const shortUrl = nanoid(7);
	try {
		// Generate QR code
		const qrCode = await QRCode.toDataURL(
			`http://localhost:3000/url/${shortUrl}`
		);

		const newUrl = await URL.create({
			originalUrl,
			shortUrl,
			owner: null,
			qrCode,
		});

		res.json({
			msg: "Short URL created successfully!",
			shortUrl,
			qrCode,
		});
	} catch (err) {
		if (err.code === 11000) {
			return res
				.status(400)
				.json({ err: "Alias already taken. Please choose another." });
		}
		res.status(500).json({ err: "Server error" });
	}
});

// Dashboard
router.get("/dashboard", isAuthenticated, async (req, res) => {
	try {
		const userEmail = req.user.email;

		// Fetch URLs that belong to this user
		const urls = await URL.find({ owner: userEmail });

		res.json({
			user: req.user, // whatever user data you want to send
			urls: urls.map((u) => ({
				_id: u._id,
				originalUrl: u.originalUrl,
				shortUrl: `http://localhost:3000/url/${u.shortUrl}`,
				clicks: u.visits, // map to "clicks" for frontend consistency
				qrCode: u.qrCode,
			})),
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Failed to load dashboard" });
	}
});

// Get analytics
router.get("/analytics/:id", async (req, res) => {
	const id = req.params.id;
	const alreadyExist = await URL.findOne({ shortUrl: id });
	if (!alreadyExist) {
		return res.status(404).json({ err: "URL not found" });
	}
	res.json({
		originalUrl: alreadyExist.originalUrl,
		shortUrl: alreadyExist.shortUrl,
		visits: alreadyExist.visits,
		visitTimestamps: alreadyExist.visitTimestamps.map((ts) =>
			new Date(ts).toLocaleString("en-US", { timeZone: "America/New_York" })
		),
	});
});

// Redirect to original URL
router.get("/:id", async (req, res) => {
	const id = req.params.id;
	const alreadyExist = await URL.findOne({ shortUrl: id });
	if (!alreadyExist) {
		return res.status(404).json({ err: "URL not found" });
	}
	// Update analytics
	alreadyExist.visits += 1;
	alreadyExist.visitTimestamps.push(Date.now());
	await alreadyExist.save();
	return res.redirect(alreadyExist.originalUrl);
});

export default router;
