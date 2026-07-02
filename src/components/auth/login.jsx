

// src/components/auth/login.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { loginUser, fetchUserProfile } from "../../redux/slices/userSlice";
import { useAlert } from "../../context/AlertContext";
import { Button, Input } from "../ui";

function LoginModal({ onClose, openSignup }) {
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      showAlert("Enter username and password", "warning");
      return;
    }

    if (password.length < 4) {
      showAlert("Password must be at least 4 characters", "warning");
      return;
    }

    setLoading(true);

    try {
      const result = await dispatch(loginUser({ username, password }));

      if (loginUser.rejected.match(result)) {
        showAlert("Invalid username or password", "error");
        setLoading(false);
        return;
      }

      await dispatch(fetchUserProfile());

      // Redux state is now populated — React re-renders the tree automatically.
      // No page reload, no state wipe, no WebSocket disconnect.
      showAlert("Login successful!", "success");
      onClose();
    } catch {
      showAlert("Login failed", "error");
    }

    setLoading(false);
  };

  // Keep the keydown listener calling the latest handleLogin without
  // re-registering (avoids stacked listeners / stale-closure double submit).
  const handleLoginRef = useRef(handleLogin);
  useEffect(() => {
    handleLoginRef.current = handleLogin;
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") handleLoginRef.current();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="w-full max-w-sm p-6 rounded-2xl shadow-xl bg-card text-card-foreground border border-border">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Login</h2>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value.trim())}
        />

        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowPassword(!showPassword);
            }}
            className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>

      <Button
        onClick={handleLogin}
        loading={loading}
        fullWidth
        size="lg"
        className="mt-6 uppercase tracking-widest font-black"
      >
        {loading ? "Logging in..." : "Login"}
      </Button>

      <div className="mt-6 text-center">
        <button
          onClick={openSignup}
          className="text-2xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Don't have an account? <span className="text-primary">Join QKICS</span>
        </button>
      </div>
    </div>
  );
}

export default LoginModal;
