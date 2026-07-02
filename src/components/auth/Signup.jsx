// src/components/auth/Signup.jsx
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { API_BASE_URL } from "../../config/api";
import { loginUser, fetchUserProfile } from "../../redux/slices/userSlice";
import { useAlert } from "../../context/AlertContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Button, Input } from "../ui";

function SignupModal({ onClose, openLogin }) {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const [username, setUsername] = useState("");
  const [usernameErr, setUsernameErr] = useState("");

  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [passwordErr, setPasswordErr] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const [loading, setLoading] = useState(false);

  // USERNAME VALIDATION
  const handleUsernameChange = async (value) => {
    value = value.toLowerCase();
    setUsername(value);

    if (!/^[a-z0-9]+$/.test(value)) {
      setUsernameErr("Only letters & numbers allowed");
      return;
    }

    if (value.length < 3) {
      setUsernameErr("Username must be at least 3 chars");
      return;
    }

    setUsernameErr("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-username/`, {
        username: value,
      });

      if (!res.data.available) setUsernameErr("Username already taken");
    } catch {
      /* network hiccup — server-side validation still guards on submit */
    }
  };

  // EMAIL VALIDATION
  const handleEmailChange = async (value) => {
    value = value.toLowerCase();
    setEmail(value);
    setEmailErr("");

    if (!value) return;

    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setEmailErr("Invalid email");
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-email/`, {
        email: value,
      });

      if (!res.data.available) setEmailErr("Email already exists");
    } catch {
      /* network hiccup — server-side validation still guards on submit */
    }
  };

  // PHONE VALIDATION
  const handlePhoneChange = async (value) => {
    if (!/^[0-9]*$/.test(value)) return;

    setPhone(value);
    setPhoneErr("");

    if (value.length > 0 && value.length !== 10) {
      setPhoneErr("Phone must be 10 digits");
      return;
    }

    try {
      if (value.length === 10) {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/check-phone/`, {
          phone: value,
        });

        if (!res.data.available) setPhoneErr("Phone already exists");
      }
    } catch {
      /* network hiccup — server-side validation still guards on submit */
    }
  };

  // PASSWORD VALIDATION
  const validatePassword = (val) => {
    setPassword(val);
    if (val.length < 4) {
      setPasswordErr("Password must be at least 4 characters");
    } else {
      setPasswordErr("");
    }
  };

  // SUBMIT SIGNUP
  const handleSignup = async () => {
    if (!username || !password || !password2) {
      showAlert("Enter required fields", "warning");
      return;
    }

    if (password.length < 4) {
      showAlert("Password must be at least 4 characters", "warning");
      return;
    }

    if (password !== password2) {
      showAlert("Passwords do not match", "error");
      return;
    }

    if (usernameErr || emailErr || phoneErr) {
      showAlert("Fix validation errors", "warning");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username,
        password,
        password2,
        email,
        phone,
        user_type: "normal",
      };

      await axios.post(`${API_BASE_URL}/v1/auth/register/`, payload);

      const result = await dispatch(loginUser({ username, password }));

      if (loginUser.rejected.match(result)) {
        showAlert("Signup succeeded but login failed", "error");
        return;
      }

      await dispatch(fetchUserProfile());

      // No window.location.reload() — Redux is already updated; React re-renders.
      showAlert("Signup successful!", "success");
      onClose();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Signup failed. Try again.",
        "error"
      );
    }

    setLoading(false);
  };

  // Keep the keydown listener calling the latest handleSignup without
  // re-registering (avoids stacked listeners / stale-closure double submit).
  const handleSignupRef = useRef(handleSignup);
  useEffect(() => {
    handleSignupRef.current = handleSignup;
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") handleSignupRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="w-full max-w-sm p-6 rounded-2xl shadow-xl space-y-3 bg-card text-card-foreground border border-border">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Sign Up</h2>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* USERNAME */}
      <Input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => handleUsernameChange(e.target.value)}
        error={usernameErr}
      />

      {/* PASSWORD */}
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={(e) => validatePassword(e.target.value)}
          className="pr-10"
          error={passwordErr}
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setShowPassword(!showPassword); }}
          className="absolute top-0 h-11 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* CONFIRM PASSWORD */}
      <div className="relative">
        <Input
          type={showPassword2 ? "text" : "password"}
          placeholder="Confirm Password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); setShowPassword2(!showPassword2); }}
          className="absolute top-0 h-11 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label={showPassword2 ? "Hide password" : "Show password"}
        >
          {showPassword2 ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>

      {/* EMAIL */}
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => handleEmailChange(e.target.value)}
        error={emailErr}
        required
      />

      {/* PHONE */}
      <Input
        type="text"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => handlePhoneChange(e.target.value)}
        error={phoneErr}
      />

      <Button
        onClick={handleSignup}
        loading={loading}
        fullWidth
        size="lg"
        className="uppercase tracking-widest font-black"
      >
        {loading ? "Creating..." : "Create Account"}
      </Button>

      <div className="pt-2 text-center">
        <button
          onClick={openLogin}
          className="text-2xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Already have an account? <span className="text-primary">Login Here</span>
        </button>
      </div>
    </div>
  );
}

export default SignupModal;
