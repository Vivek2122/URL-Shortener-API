import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({
	originalUrl: {
		type: String,
		required: true,
	},
	shortUrl: {
		type: String,
		required: true,
		unique: true,
	},
	owner: {
		type: String,
		index: true,
	},
	qrCode: {
		type: String,
	},
	visits: {
		type: Number,
		default: 0,
	},
	visitTimestamps: {
		type: [Date],
		default: [],
	},
});

const URL = new mongoose.model("URL", urlSchema);

export default URL;
