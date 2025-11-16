import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const MagicLinkLogin = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-magic-link", {
        body: { email },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        toast.error(data.error);
      } else {
        setLinkSent(true);
        toast.success("Magic link sent! Check your email.");
        
        // For development - show the magic link
        if (data?.magicLink) {
          console.log("Magic Link:", data.magicLink);
          toast.info("Check console for magic link (development only)");
        }
      }
    } catch (error: any) {
      console.error("Error sending magic link:", error);
      toast.error(error.message || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your email to receive a magic link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!linkSent ? (
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Magic Link...
                  </>
                ) : (
                  "Send Magic Link"
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Magic link sent to <strong>{email}</strong>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Click the link in your email to sign in. The link will expire in 15 minutes.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setLinkSent(false);
                  setEmail("");
                }}
              >
                Send Another Link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MagicLinkLogin;
