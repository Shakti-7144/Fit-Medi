import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Auth from "./pages/Auth";
import RoleSelect from "./pages/RoleSelect";
import Choice from "./pages/Choice";
import Fitness from "./pages/Fitness";
import Meals from "./pages/Meals";
import HealthRecords from "./pages/HealthRecords";
import Symptoms from "./pages/Symptoms";
import Profile from "./pages/Profile";
import Doctors from "./pages/Doctors";
import BookAppointment from "./pages/BookAppointment";
import Appointments from "./pages/Appointments";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorProfile from "./pages/DoctorProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster richColors position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/role" element={<ProtectedRoute><RoleSelect /></ProtectedRoute>} />
            <Route path="/choice" element={<ProtectedRoute><Choice /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/fitness" element={<Fitness />} />
              <Route path="/meals" element={<Meals />} />
              <Route path="/health" element={<HealthRecords />} />
              <Route path="/symptoms" element={<Symptoms />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/book/:doctorId" element={<BookAppointment />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/doctor" element={<DoctorDashboard />} />
              <Route path="/doctor/profile" element={<DoctorProfile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
