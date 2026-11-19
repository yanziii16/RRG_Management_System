import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { SafeImage } from "../../components/common/SafeImage";
import { useNotification } from "../../context/NotificationContext";
import { RESORT_MEDIA } from "../../data/mockData";
import { useAuth } from "../../hooks/useAuth";
import { isValidEmail } from "../../utils/validation";
const AdminLogin = () => {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Please enter a valid admin email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email, password, "ADMIN");
      notify(`Signed in as ${user.name} (Administrator).`, "success");
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <SafeImage
    src={RESORT_MEDIA.heroPool}
    alt="Luckystar Resort"
    className="w-full h-full object-cover"
  />
        <div className="absolute inset-0 bg-[#0D2725]/65 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-white border border-[#DCE5E3] rounded-xl p-6 sm:p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-xs font-bold tracking-wider uppercase text-[#143E3B]">
            Luckystar Resort
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-[#152423] tracking-tight">
            Admin login
          </h1>
          <p className="mt-1 text-xs text-[#5A6D6B]">
            Sign in with your administrator credentials to manage resort operations.
          </p>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
    label="Admin email"
    type="email"
    required
    placeholder="Enter admin email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
          <Input
    label="Password"
    type={showPwd ? "text" : "password"}
    required
    placeholder="Enter password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    rightElement={<button
      type="button"
      onClick={() => setShowPwd((p) => !p)}
      aria-label={showPwd ? "Hide password" : "Show password"}
      className="text-[#5A6D6B] hover:text-[#152423] cursor-pointer"
    >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>}
  />

          <Button type="submit" loading={submitting} size="lg" className="w-full">
            Sign in to Admin Portal
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#EEF2F1] text-center">
          <Link
    to="/"
    className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5A6D6B] hover:text-[#143E3B]"
  >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Guest Website</span>
          </Link>
        </div>
      </div>
    </div>;
};
export {
  AdminLogin
};