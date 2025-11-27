// src/pages/UserSignUp.jsx
import React, { useState } from "react";
import axios from "axios";
import {
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const UserSignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { name, email, password, confirmPassword } = formData;

    // Client-side validation
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:3000/SignUp`,
        { name, email, password, confirmPassword }
      );

      const { token, message } = response.data;

      if (token) {
        // Store token in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", "user");

        setSuccess(message || "Signup successful!");
        console.log("Signup Success:", message || "Signup successful!");
        navigate("/Login");
        
      } else {
        setError(message || "Signup failed!");
        console.log("Signup Failed:", message || "Signup failed!");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong!";
      setError(msg);
      console.log("Signup Error:", msg);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ height: "100vh", display: "flex", alignItems: "center" }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          borderRadius: 4,
          width: "100%",
          textAlign: "center",
        }}
      >
        <Typography variant="h4" gutterBottom color="primary">
          Create Account
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Sign up to get started
        </Typography>

        {error && (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ my: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Full Name"
            name="name"
            variant="outlined"
            margin="normal"
            required
            onChange={handleChange}
            value={formData.name}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            variant="outlined"
            margin="normal"
            type="email"
            required
            onChange={handleChange}
            value={formData.email}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            variant="outlined"
            margin="normal"
            type={showPassword ? "text" : "password"}
            required
            onChange={handleChange}
            value={formData.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            variant="outlined"
            margin="normal"
            type={showPassword ? "text" : "password"}
            required
            onChange={handleChange}
            value={formData.confirmPassword}
          />
          <Button
            variant="contained"
            fullWidth
            color="primary"
            type="submit"
            sx={{ mt: 3, py: 1.5, fontWeight: "bold" }}
          >
            Sign Up
          </Button>
        </form>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Already have an account?{" "}
          <a
            href="/Login"
            onClick={(e) => {
              e.preventDefault();
              navigate("/Login");
            }}
          >
            Login
          </a>
        </Typography>
      </Paper>
    </Container>
  );
};

export default UserSignUp;
