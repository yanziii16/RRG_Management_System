import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-mono-num text-red-700">403 Forbidden</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#152423]">Access restricted</h1>
      <p className="mt-1.5 text-sm text-[#5A6D6B] max-w-md">
        Your current account role does not have permission to view this page.
      </p>
      <div className="mt-5 flex gap-3">
        <Link
          to="/"
          className="px-4 py-2 text-sm font-medium text-[#152423] bg-white border border-[#DCE5E3] rounded-lg hover:bg-[#F5F8F7]"
        >
          Guest Home
        </Link>
        <Link
          to="/admin/login"
          className="px-4 py-2 text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B]"
        >
          Admin Login
        </Link>
      </div>
    </div>
  );
};

export { Unauthorized };