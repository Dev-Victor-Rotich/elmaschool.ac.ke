import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import Home from "./pages/Home";
import About from "./pages/About";
import CBC from "./pages/CBC";
import Programs from "./pages/Programs";
import Student from "./pages/Student";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import Admissions from "./pages/Admissions";
import Brochures from "./pages/Brochures";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import MagicLinkLogin from "./pages/MagicLinkLogin";
import AuthCallback from "./pages/AuthCallback";
import SetupSuperAdmin from "./pages/SetupSuperAdmin";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import BursarDashboard from "./pages/BursarDashboard";
import StudentDashboard from "./pages/StudentDashboard";

// Legacy admin routes
import AdminDashboard from "./pages/admin/Dashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ApproveUsers from "./pages/admin/ApproveUsers";
import AssignRoles from "./pages/admin/AssignRoles";
import StudentPortal from "./pages/students/Portal";
import TeacherPortal from "./pages/staff/TeacherPortal";
import BursarPortal from "./pages/staff/BursarPortal";
import AdminPortal from "./pages/admin/AdminDashboard";
import HODPortal from "./pages/staff/HODPortal";
import ClassTeacherPortal from "./pages/staff/ClassTeacherPortal";
import LibrarianPortal from "./pages/staff/LibrarianPortal";
import ChaplainPortal from "./pages/staff/ChaplainPortal";
import ClassRepPortal from "./pages/students/ClassRepPortal";
import StudentContentDashboard from "./pages/students/StudentContentDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/cbc" element={<CBC />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/student" element={<Student />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/brochures" element={<Brochures />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<MagicLinkLogin />} />
          <Route path="/auth" element={<MagicLinkLogin />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/setup" element={<SetupSuperAdmin />} />
          <Route path="/dashboard/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/dashboard/bursar" element={<BursarDashboard />} />
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          
          <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/admin/manage-students" element={<ManageStudents />} />
          <Route path="/admin/approve-users" element={<ApproveUsers />} />
          <Route path="/admin/assign-roles" element={<AssignRoles />} />
          <Route path="/students" element={<StudentPortal />} />
          <Route path="/students/portal" element={<StudentPortal />} />
          <Route path="/staff/teacher" element={<TeacherPortal />} />
          <Route path="/staff/bursar" element={<BursarPortal />} />
          <Route path="/staff/hod" element={<HODPortal />} />
          <Route path="/staff/classteacher" element={<ClassTeacherPortal />} />
          <Route path="/staff/librarian" element={<LibrarianPortal />} />
          <Route path="/staff/chaplain" element={<ChaplainPortal />} />
          <Route path="/students/class-rep" element={<ClassRepPortal />} />
          <Route path="/students/content-dashboard" element={<StudentContentDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
