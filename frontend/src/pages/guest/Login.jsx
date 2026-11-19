import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { SafeImage } from "../../components/common/SafeImage";
import { useNotification } from "../../context/NotificationContext";
import { RESORT_MEDIA } from "../../data/mockData";
import { useAuth } from "../../hooks/useAuth";
import { isValidEmail } from "../../utils/validation";
const Login = () => {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/my-reservations";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(email, password, "GUEST");
      notify(`Welcome back, ${user.name}.`, "success");
      navigate(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 bg-white border border-[#DCE5E3] rounded-xl overflow-hidden items-stretch">
        <div className="relative min-h-[260px] hidden lg:block">
          <SafeImage
    src={RESORT_MEDIA.heroPool}
    alt="Luckystar Resort pool"
    className="w-full h-full object-cover"
  />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent flex flex-col justify-end p-8 text-white">
            <p className="text-xs uppercase tracking-wider text-white/80">Your Lucky Star Account</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Welcome back to your happy place.
            </h2>
            <p className="mt-1.5 text-sm text-white/85">
              Log in to view upcoming reservations, submit payment slips, or book another stay.
            </p>
            <Link
    to="/accommodations"
    className="mt-4 inline-flex items-center justify-center px-4 py-2 text-xs font-medium text-[#152423] bg-white rounded-lg w-fit hover:bg-[#F2F6F5]"
  >
              Explore Accommodations
            </Link>
          </div>
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-center">
          <h1 className="text-2xl font-semibold text-[#152423] tracking-tight">
            Log in to your account
          </h1>
          <p className="mt-1 text-sm text-[#5A6D6B]">
            Enter the email address and password you used to register.
          </p>

          {error && <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {error}
            </div>}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Input
    label="Email"
    type="email"
    required
    placeholder="you@example.com"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />

            <Input
    label="Password"
    type={showPwd ? "text" : "password"}
    required
    placeholder="Enter your password"
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

            <Button type="submit" loading={submitting} className="w-full" size="lg">
              Login
            </Button>
          </form>

          <p className="mt-5 text-xs text-center text-[#5A6D6B]">
            New to Luckystar Resort?{" "}
            <Link
    to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
    className="font-semibold text-[#143E3B] hover:underline"
  >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>;
};
export {
  Login
};