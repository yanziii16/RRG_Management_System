import { Link, useNavigate } from "react-router-dom";
import { Menu, ExternalLink, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
const AdminHeader = ({
  onOpenMobile,
  title = "Admin Portal"
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };
  return <header className="h-16 bg-white border-b border-[#DCE5E3] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 no-print">
      <div className="flex items-center gap-3 min-w-0">
        <button
    type="button"
    onClick={onOpenMobile}
    aria-label="Open admin menu"
    className="lg:hidden p-2 rounded-lg text-[#152423] hover:bg-[#F5F8F7]"
  >
          <Menu className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#152423] truncate">{title}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Link
    to="/"
    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#143E3B] bg-[#EDF3F1] rounded-lg hover:bg-[#DCE8E5] transition-colors whitespace-nowrap"
  >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Guest Site</span>
        </Link>

        <div className="hidden md:block text-right">
          <p className="text-xs font-semibold text-[#152423] leading-tight">{user?.name}</p>
          <p className="text-[11px] text-[#5A6D6B] leading-tight">Administrator</p>
        </div>

        <button
    type="button"
    onClick={handleLogout}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#152423] border border-[#DCE5E3] rounded-lg hover:bg-[#F5F8F7] transition-colors whitespace-nowrap cursor-pointer"
  >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>;
};
export {
  AdminHeader
};
