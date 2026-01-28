import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, School, CheckCircle2, Info, User, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MagicLinkLogin = () => {
  const [email, setEmail] = useState("");
  const [loginType, setLoginType] = useState<"student" | "staff">("student");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Quick login state
  const [quickLoginName, setQuickLoginName] = useState("");
  const [quickLoginPassword, setQuickLoginPassword] = useState("");
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, validate the email exists in the registry
      const { data: registryData, error: registryError } = await supabase.functions.invoke(
        "validate-registry",
        { body: { email, type: loginType } }
      );

      if (registryError) {
        throw new Error("Failed to validate email. Please try again.");
      }

      if (!registryData?.valid) {
        throw new Error("This email is not registered in our system. Please contact the school administrator.");
      }

      // Send magic link using Supabase's built-in OTP - redirect to callback for processing
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=${loginType}`,
        },
      });

      if (otpError) {
        throw otpError;
      }

      setEmailSent(true);
      toast.success("Magic link sent to your email!");
    } catch (error: any) {
      console.error("Error sending magic link:", error);
      
      let errorMessage = "Failed to send magic link. Please try again.";
      
      if (error.message?.includes("not registered")) {
        errorMessage = error.message;
      } else if (error.message?.includes("rate limit")) {
        errorMessage = "Too many requests. Please wait a few minutes before trying again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, {
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickLoginLoading(true);

    try {
      // Call edge function to validate credentials and get auth token
      const { data, error } = await supabase.functions.invoke("student-quick-login", {
        body: { fullName: quickLoginName, password: quickLoginPassword }
      });

      if (error) {
        throw new Error("Login failed. Please try again.");
      }

      if (!data?.valid) {
        toast.error(data?.message || "Wrong password", { duration: 3000 });
        return;
      }

      // Use the token to verify OTP and establish session directly
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token_hash,
        type: 'email',
      });

      if (verifyError) {
        console.error("OTP verification error:", verifyError);
        throw new Error("Login failed. Please try again.");
      }

      // Redirect to student portal
      toast.success("Welcome back!");
      navigate("/students/portal", { replace: true });
    } catch (error: any) {
      console.error("Error with quick login:", error);
      toast.error(error.message || "Login failed. Please try again.", { duration: 3000 });
    } finally {
      setQuickLoginLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-background/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              A secure login link has been sent to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-primary/20 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription>
                <strong>Check your email inbox</strong> for a secure login link. The link expires in <strong>1 hour</strong>.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">What to do next:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open your email inbox</li>
                <li>Look for an email from Elma School</li>
                <li>Click the "Log in" button in the email</li>
                <li>You'll be redirected to your dashboard</li>
              </ol>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Didn't receive the email? Check your spam folder or try again with a different email address.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                  setQuickLoginName("");
                  setQuickLoginPassword("");
                }}
              >
                Try Different Email
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => navigate("/")}>
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-background/95 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <School className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Elma School,Kamonong
          </CardTitle>
          <CardDescription className="text-base">Secure Portal Access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Login Type Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={loginType === "student" ? "default" : "outline"}
              className="w-full h-10 text-sm"
              onClick={() => setLoginType("student")}
              disabled={loading || quickLoginLoading}
            >
              Student
            </Button>
            <Button
              type="button"
              variant={loginType === "staff" ? "default" : "outline"}
              className="w-full h-10 text-sm"
              onClick={() => setLoginType("staff")}
              disabled={loading || quickLoginLoading}
            >
              Staff
            </Button>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder={loginType === "student" ? "Enter your registered student email" : "Enter your registered staff email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || quickLoginLoading}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={loading || quickLoginLoading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-5 w-5" />
                  Send Magic Link
                </>
              )}
            </Button>
          </form>

          {/* Student Quick Login Section - Only visible for students */}
          {loginType === "student" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-sm font-semibold flex items-center justify-center gap-2">
                    <User className="h-4 w-4" />
                    Student Quick Login
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Login with your name and password
                  </p>
                </div>

                <form onSubmit={handleQuickLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="e.g., Elizabeth Keen"
                        value={quickLoginName}
                        onChange={(e) => setQuickLoginName(e.target.value)}
                        required
                        disabled={loading || quickLoginLoading}
                        className="pl-10 h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="e.g., KEEN314"
                        value={quickLoginPassword}
                        onChange={(e) => setQuickLoginPassword(e.target.value)}
                        required
                        disabled={loading || quickLoginLoading}
                        className="pl-10 pr-10 h-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="secondary"
                    className="w-full h-12 text-base font-semibold" 
                    disabled={loading || quickLoginLoading}
                  >
                    {quickLoginLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Login
                      </>
                    )}
                  </Button>

                  <Alert className="border-muted bg-muted/50">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Password format:</strong> Last Name (CAPS) + Admission Number
                      <br />
                      Example: Elizabeth Keen with admission 314 → <strong>KEEN314</strong>
                    </AlertDescription>
                  </Alert>
                </form>
              </div>
            </>
          )}

          <Alert className="border-primary/20 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Only registered users can access the portal. If you haven't been registered by the administrator, please
              contact the school office.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-2">
            <p className="text-xs text-muted-foreground">By logging in, you agree to our Terms of Service</p>
            <Button type="button" variant="link" className="text-primary" onClick={() => navigate("/")}>
              Return to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MagicLinkLogin;
