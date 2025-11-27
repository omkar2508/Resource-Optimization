// src/pages/UsersLoginPage.jsx
import React, { useState } from "react";
import axios from "axios";
import {
  Box,
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

const UsersLoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // reset error

    try {
      // 1) Await the POST so we can read response.data
      const response = await axios.post(
        `http://localhost:3000/Login`,
        {
          email: credentials.email,
          password: credentials.password,
        }
      );

      // 2) Extract token from response
      const { token } = response.data;
      if (!token) {
        throw new Error("No token returned");
      }

      // 3) Store the token in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", "user");
      

      console.log("Login Success !!");

      navigate("/");
    } catch (err) {
      console.error("Login failed:", err);
      // Show backend message if available, or generic fallback
      setError(err.response?.data?.message || err.message || "Login failed");
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
          Welcome Back
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Login to your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            variant="outlined"
            margin="normal"
            type="email"
            required
            value={credentials.email}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            variant="outlined"
            margin="normal"
            type={showPassword ? "text" : "password"}
            required
            value={credentials.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            fullWidth
            color="primary"
            type="submit"
            sx={{ mt: 3, py: 1.5, fontWeight: "bold" }}
          >
            Login
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 2 }}>
          Don't have an account?{" "}
          <a
            href="/SignUp"
            onClick={(e) => {
              e.preventDefault();
              navigate("/SignUp");
            }}
          >
            Sign up
          </a>
        </Typography>
      </Paper>
    </Container>
  );
};

export default UsersLoginPage;