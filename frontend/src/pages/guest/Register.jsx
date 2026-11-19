import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { SafeImage } from "../../components/common/SafeImage";
import { useNotification } from "../../context/NotificationContext";
import { RESORT_MEDIA } from "../../data/mockData";
import { useAuth } from "../../hooks/useAuth";
import { isValidEmail, isValidPhone, validatePassword } from "../../utils/validation";
const Register = () => {
  const { register } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/my-reservations";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError("Please enter a valid contact number (at least 10 digits).");
      return;
    }
    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the resort terms and privacy policy.");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, email, phone, address, password });
      notify("Account created! Welcome to Luckystar Resort.", "success");
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register.");
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 bg-white border border-[#DCE5E3] rounded-xl overflow-hidden items-stretch">
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <h1 className="text-2xl font-semibold text-[#152423] tracking-tight">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-[#5A6D6B]">
            Join Luckystar Resort to book suites, reserve cottages, and manage your stays.
          </p>

          {error && <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <Input
    label="Full name"
    required
    placeholder="Enter your full name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />
            <Input
    label="Email address"
    type="email"
    required
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
            <Input
    label="Contact number"
    type="tel"
    required
    placeholder="+63 912 345 6789"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
  />
            <Input
    label="Address (optional)"
    placeholder="City or Province"
    value={address}
    onChange={(e) => setAddress(e.target.value)}
  />
            <Input
    label="Password"
    type={showPwd ? "text" : "password"}
    required
    placeholder="Minimum 6 characters"
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
            <Input
    label="Confirm password"
    type={showPwd ? "text" : "password"}
    required
    placeholder="Re-enter your password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
  />

            <label className="flex items-start gap-2 text-xs text-[#5A6D6B] pt-1 cursor-pointer">
              <input
    type="checkbox"
    checked={agreed}
    onChange={(e) => setAgreed(e.target.checked)}
    className="mt-0.5 rounded border-[#DCE5E3] text-[#143E3B]"
  />
              <span>I agree to the Luckystar Resort booking terms and privacy policy.</span>
            </label>

            <Button type="submit" loading={submitting} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-5 text-xs text-center text-[#5A6D6B]">
            Already have an account?{" "}
            <Link
    to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
    className="font-semibold text-[#143E3B] hover:underline"
  >
              Log in
            </Link>
          </p>
        </div>

        <div className="relative min-h-[260px] hidden lg:block">
          <SafeImage
    src={RESORT_MEDIA.heroPool}
    alt="Luckystar Resort swimming pool"
    className="w-full h-full object-cover"
  />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-8 text-white">
            <h2 className="text-2xl font-semibold tracking-tight">
              A little closer to your next escape.
            </h2>
            <p className="mt-1.5 text-sm text-white/85">
              Reserve overnight suites and poolside cottages in minutes.
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export {
  Register
};
