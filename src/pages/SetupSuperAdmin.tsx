import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SetupSuperAdmin = () => {
  const [email, setEmail] = useState("chelelgorotichvictor2604@gmail.com");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("init-superadmin", {
        body: { email, secret },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
      } else {
        setSuccess(true);
        toast.success("SuperAdmin account created successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Error initializing SuperAdmin:", error);
      toast.error(error.message || "Failed to initialize SuperAdmin");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-0 bg-background/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Setup Complete!</CardTitle>
            <CardDescription className="text-base">
              Your SuperAdmin account has been created successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You can now login using the magic link system. You'll be redirected to the login page shortly.
              </AlertDescription>
            </Alert>
            <Button
              className="w-full"
              onClick={() => navigate("/login")}
            >
              Go to Login
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
            SuperAdmin Setup
          </CardTitle>
          <CardDescription className="text-base">
            Initialize your SuperAdmin account for El Makamong High School
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetup} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Setup Secret</label>
              <Input
                type="password"
                placeholder="Enter setup secret code"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                disabled={loading}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Default: change-me-in-production
              </p>
            </div>

            <Alert className="border-primary/20 bg-primary/5">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                This is a one-time setup. After creating the SuperAdmin account, use the magic link login system to access the dashboard.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold shadow-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Setting Up...
                </>
              ) : (
                "Initialize SuperAdmin"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupSuperAdmin;
