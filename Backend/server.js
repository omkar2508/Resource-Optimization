import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./utils/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// --------------------
// User Signup Route
// --------------------
app.post("/SignUp", async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // 1️⃣ Basic validation
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    // 2️⃣ Check if user already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      if (results.length > 0) return res.status(400).json({ message: "Email already registered" });

      // 3️⃣ Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4️⃣ Insert user into DB
      db.query(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        (err, result) => {
          if (err) return res.status(500).json({ message: err.message });

          // 5️⃣ Generate JWT token
          const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET || "secretkey", {
            expiresIn: "7d",
          });

          res.json({
            message: "User registered successfully",
            token,
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.post("/Login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ message: err.message });

      if (results.length === 0) {
        return res.status(400).json({ message: "User not found. Please signup first." });
      }

      const user = results[0];

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Generate JWT token
      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || "secretkey", {
        expiresIn: "7d",
      });

      res.json({ message: "Login successful", token });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// --------------------
// Test route
// --------------------
app.get("/", (req, res) => {
  res.send("Hello from Express backend!");
});

// --------------------
// Start server
// --------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
