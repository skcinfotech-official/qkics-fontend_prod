import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axiosSecure from "../utils/axiosSecure";
import { getAccessToken } from "../../redux/store/tokenManager";
import { useAlert } from "../../context/AlertContext";
import { Button, Input } from "../ui";

// Password input with a show/hide toggle — used 3× below.
function PasswordField({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="pr-10"
      />
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); setShow((s) => !s); }}
        className="absolute top-0 h-11 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const { showAlert } = useAlert();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  const handleChangePassword = async () => {
    try {
      const token = getAccessToken();

      const payload = {
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2,
      };

      const res = await axiosSecure.post(
        `/v1/auth/me/change-password/`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      showAlert(res.data.message || "Password changed successfully.", "success");
      onClose();
    } catch (error) {
      showAlert(error.response?.data?.message || "Failed to change password", "error");
    }
  };

  return (
    <div className="w-full max-w-sm p-6 rounded-2xl shadow-xl space-y-3 bg-card text-card-foreground border border-border">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">Change Password</h2>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <PasswordField
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        placeholder="Old Password"
      />
      <PasswordField
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New Password"
      />
      <PasswordField
        value={newPassword2}
        onChange={(e) => setNewPassword2(e.target.value)}
        placeholder="Confirm New Password"
      />

      <Button onClick={handleChangePassword} fullWidth size="lg" className="mt-1">
        Update Password
      </Button>
    </div>
  );
}

export default ChangePasswordModal;
