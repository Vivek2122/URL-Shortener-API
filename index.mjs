import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./Routers/authRouter.mjs";
import urlRouter from "./Routers/urlRouter.mjs";
import passport from "./Auth/passport.mjs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
	cors({
		origin: "https://url-shotener-frontend.onrender.com",
		credentials: true,
	})
);
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("Connected to DB successfully"))
	.catch((err) => console.log("DB connection error:", err.message));

app.use("/api", authRouter);
app.use("/url", urlRouter);

app.listen(PORT, () => {
	console.log(`app running at ${PORT}`);
});
