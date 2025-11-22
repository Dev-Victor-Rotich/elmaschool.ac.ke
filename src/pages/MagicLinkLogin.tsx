import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, School, CheckCircle2, Info } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MagicLinkLogin = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, validate the email exists in the registry
      const { data: registryData, error: registryError } = await supabase.functions.invoke(
        "validate-registry",
        { body: { email } }
      );

      if (registryError) {
        throw new Error("Failed to validate email. Please try again.");
      }

      if (!registryData?.valid) {
        throw new Error("This email is not registered in our system. Please contact the school administrator.");
      }

      // Send magic link using Supabase's built-in OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        <CardContent>
          <form onSubmit={handleMagicLink} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg" disabled={loading}>
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MagicLinkLogin;
