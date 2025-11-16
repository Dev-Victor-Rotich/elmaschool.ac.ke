import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck, User } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Admin login state
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // Student signup state
  const [studentFullName, setStudentFullName] = useState("");
  const [studentAdmNo, setStudentAdmNo] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  // Student login state
  const [studentLoginEmail, setStudentLoginEmail] = useState("");
  const [studentLoginPassword, setStudentLoginPassword] = useState("");

  // Staff signup state
  const [staffFullName, setStaffFullName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkUserRoleAndRedirect(session.user.id);
      }
    });
  }, []);

  const checkUserRoleAndRedirect = async (userId: string) => {
    // Check approval status
    const { data: profile } = await supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", userId)
      .single();

    if (profile?.approval_status === "pending") {
      toast.info("Your account is pending approval. Please wait for admin approval.");
      await supabase.auth.signOut();
      return;
    }

    if (profile?.approval_status === "rejected") {
      toast.error("Your account was not approved. Please contact administration.");
      await supabase.auth.signOut();
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (roles && roles.length > 0) {
      const userRole = roles[0].role;
      if (userRole === "student") {
        navigate("/students");
      } else if (userRole === "teacher" || userRole === "hod") {
        navigate("/staff/teacher");
      } else if (userRole === "bursar") {
        navigate("/staff/bursar");
      } else {
        navigate("/admin");
      }
    } else {
      toast.info("No role assigned yet. Please wait for admin to assign your role.");
      await supabase.auth.signOut();
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      // Check if user has admin role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (roles && roles.length > 0 && roles[0].role !== "student") {
        // Check approval status
        const { data: profile } = await supabase
          .from("profiles")
          .select("approval_status")
          .eq("id", data.user.id)
          .single();

        if (profile?.approval_status !== "approved") {
          await supabase.auth.signOut();
          toast.error("Your account is pending approval.");
          setLoading(false);
          return;
        }

        toast.success("Welcome back!");
        const userRole = roles[0].role;
        if (userRole === "teacher" || userRole === "hod") {
          navigate("/staff/teacher");
        } else if (userRole === "bursar") {
          navigate("/staff/bursar");
        } else {
          navigate("/admin");
        }
      } else {
        await supabase.auth.signOut();
        toast.error("Access denied. Admin credentials required.");
      }
    }
    setLoading(false);
  };

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate student via secure Edge Function (no sensitive data exposed)
    const { data: validation, error: validationError } = await supabase.functions.invoke(
      'validate-student',
      {
        body: {
          fullName: studentFullName,
          admissionNumber: studentAdmNo,
        },
      }
    );

    if (validationError || !validation?.valid) {
      toast.error(validation?.message || "No matching student data found. Please contact the school administration.");
      setLoading(false);
      return;
    }

    const studentId = validation.studentId;

    // Validate email format: firstnamelastnameadm@gmail.com
    const expectedEmail = `${studentFullName.toLowerCase().replace(/\s+/g, '')}${studentAdmNo}@gmail.com`;
    if (studentEmail.toLowerCase() !== expectedEmail.toLowerCase()) {
      toast.error(`Email must be in format: ${expectedEmail}`);
      setLoading(false);
      return;
    }

    // Create user account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: studentEmail,
      password: studentPassword,
      options: {
        data: {
          full_name: studentFullName,
        },
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Update student data with user_id and mark as registered
      await supabase
        .from("students_data")
        .update({ user_id: authData.user.id, is_registered: true })
        .eq("id", studentId);

      // Assign student role
      await supabase
        .from("user_roles")
        .insert({ user_id: authData.user.id, role: "student" });

      toast.success("Registration successful! Please log in.");
      setStudentFullName("");
      setStudentAdmNo("");
      setStudentEmail("");
      setStudentPassword("");
    }

    setLoading(false);
  };

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: studentLoginEmail,
      password: studentLoginPassword,
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      // Verify student role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (roles && roles.length > 0 && roles[0].role === "student") {
        // Check approval status
        const { data: profile } = await supabase
          .from("profiles")
          .select("approval_status")
          .eq("id", data.user.id)
          .single();

        if (profile?.approval_status !== "approved") {
          await supabase.auth.signOut();
          toast.error("Your account is pending approval.");
          setLoading(false);
          return;
        }

        toast.success("Welcome back!");
        navigate("/students");
      } else {
        await supabase.auth.signOut();
        toast.error("Student credentials required.");
      }
    }
    setLoading(false);
  };

  const handleStaffSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Create user account
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: staffEmail,
      password: staffPassword,
      options: {
        data: {
          full_name: staffFullName,
          phone_number: staffPhone,
        },
      },
    });

    if (signUpError) {
      toast.error(signUpError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      toast.success("Registration successful! Please wait for the Super Admin to assign your role.");
      setStaffFullName("");
      setStaffEmail("");
      setStaffPhone("");
      setStaffPassword("");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">Elma Kamonong High School</h1>
          <p className="text-muted-foreground">Portal Access</p>
        </div>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="admin">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Admin / Staff
            </TabsTrigger>
            <TabsTrigger value="student">
              <User className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
          </TabsList>

          {/* Admin/Staff Portal */}
          <TabsContent value="admin">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Staff Sign Up</TabsTrigger>
              </TabsList>

              {/* Admin/Staff Login */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Admin & Staff Login</CardTitle>
                    <CardDescription>
                      Access the admin portal with your credentials
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          placeholder="admin@school.com"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Staff Signup */}
              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Registration</CardTitle>
                    <CardDescription>
                      Register as a new staff member. Super Admin will assign your role.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleStaffSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="staff-name">Full Name</Label>
                        <Input
                          id="staff-name"
                          type="text"
                          placeholder="Your full name"
                          value={staffFullName}
                          onChange={(e) => setStaffFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="staff-email">Email</Label>
                        <Input
                          id="staff-email"
                          type="email"
                          placeholder="your.email@school.com"
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="staff-phone">Phone Number</Label>
                        <Input
                          id="staff-phone"
                          type="tel"
                          placeholder="0712345678"
                          value={staffPhone}
                          onChange={(e) => setStaffPhone(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="staff-password">Create Password</Label>
                        <Input
                          id="staff-password"
                          type="password"
                          placeholder="Choose a strong password"
                          value={staffPassword}
                          onChange={(e) => setStaffPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Student Portal */}
          <TabsContent value="student">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Student Login */}
              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Login</CardTitle>
                    <CardDescription>
                      Access your student portal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleStudentLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-login-email">Email</Label>
                        <Input
                          id="student-login-email"
                          type="email"
                          placeholder="johndoe123@gmail.com"
                          value={studentLoginEmail}
                          onChange={(e) => setStudentLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-login-password">Password</Label>
                        <Input
                          id="student-login-password"
                          type="password"
                          value={studentLoginPassword}
                          onChange={(e) => setStudentLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Student Signup */}
              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Registration</CardTitle>
                    <CardDescription>
                      Register using your admission details provided by the school
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleStudentSignup} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-name">Full Name</Label>
                        <Input
                          id="student-name"
                          type="text"
                          placeholder="As registered with the school"
                          value={studentFullName}
                          onChange={(e) => setStudentFullName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-adm">Admission Number</Label>
                        <Input
                          id="student-adm"
                          type="text"
                          placeholder="Your admission number"
                          value={studentAdmNo}
                          onChange={(e) => setStudentAdmNo(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-email">Email</Label>
                        <Input
                          id="student-email"
                          type="email"
                          placeholder="firstnamelastnameadm@gmail.com"
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Format: [firstname][lastname][admno]@gmail.com
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-password">Create Password</Label>
                        <Input
                          id="student-password"
                          type="password"
                          placeholder="Choose a strong password"
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Registering..." : "Register"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
