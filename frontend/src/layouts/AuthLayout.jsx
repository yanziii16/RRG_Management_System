import { Outlet } from "react-router-dom";
const AuthLayout = () => {
  return <div className="min-h-screen bg-[#F5F8F7] flex flex-col justify-center">
      <Outlet />
    </div>;
};
export {
  AuthLayout
};
