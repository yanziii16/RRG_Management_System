import { Link } from "react-router-dom";
const NotFound = () => {
  return <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-xs font-mono-num text-[#5A6D6B]">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-[#152423]">Page not found</h1>
      <p className="mt-1.5 text-sm text-[#5A6D6B] max-w-md">
        The page you are looking for could not be located.
      </p>
      <Link
    to="/"
    className="mt-5 px-4 py-2 text-sm font-medium text-white bg-[#143E3B] rounded-lg hover:bg-[#0E2E2B]"
  >
        Return Home
      </Link>
    </div>;
};
export {
  NotFound
};
