import bcrypt from "bcrypt";
import { User } from "../models/users.js"; // Ensure the path is correct
import router from "./containerRoutes.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    console.log(token);

    res.json({ token });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Server error", error });
  }
});
export default router;
