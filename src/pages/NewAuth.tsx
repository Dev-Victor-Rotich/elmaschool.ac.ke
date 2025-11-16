import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck, User, Mail } from "lucide-react";

type SignupStep = 'details' | 'otp' | 'password';

const NewAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>('details');

  // Staff signup state
  const [staffRole, setStaffRole] = useState("");
  const [staffFullName, setStaffFullName] = useState("");
  const [staffIdNumber, setStaffIdNumber] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffOTP, setStaffOTP] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffConfirmPassword, setStaffConfirmPassword] = useState("");
  const [debugOTP, setDebugOTP] = useState(""); // For development only

  // Student signup state
  const [studentFullName, setStudentFullName] = useState("");
  const [studentAdmNo, setStudentAdmNo] = useState("");
  const [studentParentPhone, setStudentParentPhone] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentOTP, setStudentOTP] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [studentConfirmPassword, setStudentConfirmPassword] = useState("");
  const [studentDebugOTP, setStudentDebugOTP] = useState(""); // For development

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const staffRoles = [
    { value: "admin", label: "Admin / Deputy" },
    { value: "bursar", label: "Bursar" },
    { value: "chaplain", label: "Chaplain" },
    { value: "hod", label: "HOD (Head of Department)" },
    { value: "teacher", label: "Teacher" },
  ];

  // Staff signup flow
  const handleStaffDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify staff exists in registry
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'verify-staff',
        {
          body: {
            fullName: staffFullName,
            idNumber: staffIdNumber,
            phone: staffPhone,
            email: staffEmail,
          },
        }
      );

      if (verifyError || !verifyData?.valid) {
        toast.error(verifyData?.message || "Your data is not registered by the school.");
        setLoading(false);
        return;
      }

      // Send OTP
      const { data: otpData, error: otpError } = await supabase.functions.invoke(
        'send-otp',
        {
          body: { email: staffEmail },
        }
      );

      if (otpError || !otpData?.success) {
        toast.error(otpData?.message || "Failed to send OTP");
        setLoading(false);
        return;
      }

      // Store debug OTP (remove in production)
      if (otpData.debug_otp) {
        setDebugOTP(otpData.debug_otp);
        toast.info(`OTP sent! (Dev: ${otpData.debug_otp})`);
      } else {
        toast.success("OTP sent to your email!");
      }

      setSignupStep('otp');
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }

    setLoading(false);
  };

  const handleStaffOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify OTP
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'verify-otp',
        {
          body: {
            email: staffEmail,
            otp: staffOTP,
          },
        }
      );

      if (verifyError || !verifyData?.valid) {
        toast.error(verifyData?.message || "Invalid OTP");
        setLoading(false);
        return;
      }

      toast.success("OTP verified! Create your password.");
      setSignupStep('password');
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }

    setLoading(false);
  };

  const handleStaffPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (staffPassword !== staffConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (staffPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: staffEmail,
        password: staffPassword,
        options: {
          data: {
            full_name: staffFullName,
            phone_number: staffPhone,
            id_number: staffIdNumber,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Update profile with id_number
        await supabase
          .from("profiles")
          .update({ id_number: staffIdNumber })
          .eq("id", authData.user.id);

        // Assign role
        await supabase
          .from("user_roles")
          .insert([{ user_id: authData.user.id, role: staffRole as any }]);

        toast.success("Registration successful! Your account is pending approval.");
        
        // Reset form
        setStaffFullName("");
        setStaffIdNumber("");
        setStaffPhone("");
        setStaffEmail("");
        setStaffOTP("");
        setStaffPassword("");
        setStaffConfirmPassword("");
        setStaffRole("");
        setSignupStep('details');
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }

    setLoading(false);
  };

  // Student signup flow
  const handleStudentDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate student via Edge Function
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
        toast.error(validation?.message || "Your data is not registered by the school.");
        setLoading(false);
        return;
      }

      // Send OTP
      const { data: otpData, error: otpError } = await supabase.functions.invoke(
        'send-otp',
        {
          body: { email: studentEmail },
        }
      );

      if (otpError || !otpData?.success) {
        toast.error(otpData?.message || "Failed to send OTP");
        setLoading(false);
        return;
      }

      // Store debug OTP (remove in production)
      if (otpData.debug_otp) {
        setStudentDebugOTP(otpData.debug_otp);
        toast.info(`OTP sent! (Dev: ${otpData.debug_otp})`);
      } else {
        toast.success("OTP sent to your email!");
      }

      setSignupStep('otp');
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }

    setLoading(false);
  };

  const handleStudentOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verify OTP
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'verify-otp',
        {
          body: {
            email: studentEmail,
            otp: studentOTP,
          },
        }
      );

      if (verifyError || !verifyData?.valid) {
        toast.error(verifyData?.message || "Invalid OTP");
        setLoading(false);
        return;
      }

      toast.success("OTP verified! Create your password.");
      setSignupStep('password');
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }

    setLoading(false);
  };

  const handleStudentPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (studentPassword !== studentConfirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (studentPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Create auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: studentEmail,
        password: studentPassword,
        options: {
          data: {
            full_name: studentFullName,
          },
        },
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Update student data with user_id and email
        await supabase
          .from("students_data")
          .update({ 
            user_id: authData.user.id, 
            email: studentEmail,
            is_registered: true 
          })
          .eq("admission_number", studentAdmNo);

        // Assign student role
        await supabase
          .from("user_roles")
          .insert([{ user_id: authData.user.id, role: "student" }]);

        toast.success("Registration successful! Your account is pending approval.");
        
        // Reset form
        setStudentFullName("");
        setStudentAdmNo("");
        setStudentParentPhone("");
        setStudentEmail("");
        setStudentOTP("");
        setStudentPassword("");
        setStudentConfirmPassword("");
        setSignupStep('details');
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      console.error(error);
    }

    setLoading(false);
  };

  // Login flow
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Check approval status
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", data.user.id)
        .single();

      if (profile?.status !== "approved") {
        await supabase.auth.signOut();
        toast.error("Your account is pending approval or has been rejected.");
        setLoading(false);
        return;
      }

      // Get user role and redirect
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);

      if (roles && roles.length > 0) {
        const userRole = roles[0].role;
        toast.success("Welcome back!");
        
        switch (userRole) {
          case "super_admin":
            navigate("/admin/dashboard");
            break;
          case "admin":
            navigate("/admin");
            break;
          case "hod":
            navigate("/staff/hod");
            break;
          case "teacher":
            navigate("/staff/teacher");
            break;
          case "classteacher":
            navigate("/staff/classteacher");
            break;
          case "bursar":
            navigate("/staff/bursar");
            break;
          case "librarian":
            navigate("/staff/librarian");
            break;
          case "chaplain":
            navigate("/staff/chaplain");
            break;
          case "class_rep":
            navigate("/students/class-rep");
            break;
          case "student":
            navigate("/students");
            break;
          default:
            navigate("/");
        }
      } else {
        await supabase.auth.signOut();
        toast.error("No role assigned. Please contact administration.");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <GraduationCap className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-2">Elma Kamonong High School</h1>
          <p className="text-muted-foreground">Secure Portal Access</p>
        </div>

        <Tabs defaultValue="staff" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="staff">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Staff
            </TabsTrigger>
            <TabsTrigger value="student">
              <User className="w-4 h-4 mr-2" />
              Students
            </TabsTrigger>
          </TabsList>

          {/* Staff Tab */}
          <TabsContent value="staff">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Join as Staff</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Login</CardTitle>
                    <CardDescription>Enter your credentials to access your dashboard</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="staff-login-email">Email</Label>
                        <Input
                          id="staff-login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="staff-login-password">Password</Label>
                        <Input
                          id="staff-login-password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
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

              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Staff Registration</CardTitle>
                    <CardDescription>
                      {signupStep === 'details' && "Enter your details to verify your identity"}
                      {signupStep === 'otp' && "Enter the OTP sent to your email"}
                      {signupStep === 'password' && "Create a secure password"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {signupStep === 'details' && (
                      <form onSubmit={handleStaffDetailsSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="staff-role">Select Your Role</Label>
                          <Select value={staffRole} onValueChange={setStaffRole} required>
                            <SelectTrigger id="staff-role">
                              <SelectValue placeholder="Choose your role" />
                            </SelectTrigger>
                            <SelectContent>
                              {staffRoles.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-fullname">Full Name</Label>
                          <Input
                            id="staff-fullname"
                            value={staffFullName}
                            onChange={(e) => setStaffFullName(e.target.value)}
                            placeholder="As registered in school records"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-id">ID Number</Label>
                          <Input
                            id="staff-id"
                            value={staffIdNumber}
                            onChange={(e) => setStaffIdNumber(e.target.value)}
                            placeholder="Your national ID number"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-phone">Phone Number</Label>
                          <Input
                            id="staff-phone"
                            type="tel"
                            value={staffPhone}
                            onChange={(e) => setStaffPhone(e.target.value)}
                            placeholder="07XXXXXXXX"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-email">Email</Label>
                          <Input
                            id="staff-email"
                            type="email"
                            value={staffEmail}
                            onChange={(e) => setStaffEmail(e.target.value)}
                            placeholder="your.email@gmail.com"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading || !staffRole}>
                          {loading ? "Verifying..." : "Continue"}
                        </Button>
                      </form>
                    )}

                    {signupStep === 'otp' && (
                      <form onSubmit={handleStaffOTPSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg mb-4">
                          <Mail className="w-5 h-5 text-primary" />
                          <p className="text-sm">We've sent a verification code to {staffEmail}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-otp">Enter OTP</Label>
                          <Input
                            id="staff-otp"
                            value={staffOTP}
                            onChange={(e) => setStaffOTP(e.target.value)}
                            placeholder="6-digit code"
                            maxLength={6}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setSignupStep('details')}>
                            Back
                          </Button>
                          <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                          </Button>
                        </div>
                      </form>
                    )}

                    {signupStep === 'password' && (
                      <form onSubmit={handleStaffPasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="staff-password">Password</Label>
                          <Input
                            id="staff-password"
                            type="password"
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="staff-confirm-password">Confirm Password</Label>
                          <Input
                            id="staff-confirm-password"
                            type="password"
                            value={staffConfirmPassword}
                            onChange={(e) => setStaffConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Creating Account..." : "Complete Registration"}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Student Tab */}
          <TabsContent value="student">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Join as Student</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Login</CardTitle>
                    <CardDescription>Access your student portal</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="student-login-email">Email</Label>
                        <Input
                          id="student-login-email"
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="student-login-password">Password</Label>
                        <Input
                          id="student-login-password"
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
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

              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Registration</CardTitle>
                    <CardDescription>
                      {signupStep === 'details' && "Enter your details to verify your identity"}
                      {signupStep === 'otp' && "Enter the OTP sent to your email"}
                      {signupStep === 'password' && "Create a secure password"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {signupStep === 'details' && (
                      <form onSubmit={handleStudentDetailsSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="student-fullname">Full Name</Label>
                          <Input
                            id="student-fullname"
                            value={studentFullName}
                            onChange={(e) => setStudentFullName(e.target.value)}
                            placeholder="As registered in school records"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-admno">Admission Number</Label>
                          <Input
                            id="student-admno"
                            value={studentAdmNo}
                            onChange={(e) => setStudentAdmNo(e.target.value)}
                            placeholder="Your admission number"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-parent-phone">Parent Phone Number</Label>
                          <Input
                            id="student-parent-phone"
                            type="tel"
                            value={studentParentPhone}
                            onChange={(e) => setStudentParentPhone(e.target.value)}
                            placeholder="07XXXXXXXX"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-email">Email</Label>
                          <Input
                            id="student-email"
                            type="email"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            placeholder="your.email@gmail.com"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Verifying..." : "Continue"}
                        </Button>
                      </form>
                    )}

                    {signupStep === 'otp' && (
                      <form onSubmit={handleStudentOTPSubmit} className="space-y-4">
                        <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg mb-4">
                          <Mail className="w-5 h-5 text-primary" />
                          <p className="text-sm">We've sent a verification code to {studentEmail}</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-otp">Enter OTP</Label>
                          <Input
                            id="student-otp"
                            value={studentOTP}
                            onChange={(e) => setStudentOTP(e.target.value)}
                            placeholder="6-digit code"
                            maxLength={6}
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={() => setSignupStep('details')}>
                            Back
                          </Button>
                          <Button type="submit" className="flex-1" disabled={loading}>
                            {loading ? "Verifying..." : "Verify OTP"}
                          </Button>
                        </div>
                      </form>
                    )}

                    {signupStep === 'password' && (
                      <form onSubmit={handleStudentPasswordSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="student-password">Password</Label>
                          <Input
                            id="student-password"
                            type="password"
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-confirm-password">Confirm Password</Label>
                          <Input
                            id="student-confirm-password"
                            type="password"
                            value={studentConfirmPassword}
                            onChange={(e) => setStudentConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? "Creating Account..." : "Complete Registration"}
                        </Button>
                      </form>
                    )}
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

export default NewAuth;