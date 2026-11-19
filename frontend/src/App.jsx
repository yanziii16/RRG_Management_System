import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ReservationProvider } from "./context/ReservationContext";
import { AppRoutes } from "./routes/AppRoutes";
function App() {
  return <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <ReservationProvider>
            <AppRoutes />
          </ReservationProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>;
}
export {
  App as default
};
