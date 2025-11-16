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
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the send-magic-link edge function
      const { data, error } = await supabase.functions.invoke("send-magic-link", {
        body: { email },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        toast.error(data.error);
      } else {
        setEmailSent(true);
        setMagicLink(data?.magicLink ?? null);
        toast.success(data?.magicLink ? "Magic link generated. You can open it below." : "Magic link sent! Check your email.");
      }
    } catch (error: any) {
      console.error("Error sending magic link:", error);
      toast.error(error.message || "Failed to send magic link. Please try again.");
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
              We've sent a secure login link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Click the link in your email to access your dashboard. The link will expire in 15 minutes.
              </AlertDescription>
            </Alert>
            {magicLink && (
              <div className="space-y-2">
                <Button className="w-full" onClick={() => (window.location.href = magicLink)}>
                  Open Login Link
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(magicLink);
                    toast.success("Magic link copied");
                  }}
                >
                  Copy Magic Link
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEmailSent(false);
                setEmail("");
                setMagicLink(null);
              }}
            >
              Try a Different Email
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Return to Home
            </Button>
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
            El Makamong High School
          </CardTitle>
          <CardDescription className="text-base">
            Secure Portal Access
          </CardDescription>
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

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-lg"
              disabled={loading}
            >
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
                Only registered users can access the portal. If you haven't been registered by the administrator, please contact the school office.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                By logging in, you agree to our Terms of Service
              </p>
              <Button
                type="button"
                variant="link"
                className="text-primary"
                onClick={() => navigate("/")}
              >
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
