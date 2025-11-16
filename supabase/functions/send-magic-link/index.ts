import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMagicLinkRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email }: SendMagicLinkRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Checking if email is registered:", email);

    // Check if user exists in auth.users using admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to verify email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedEmail = Deno.env.get("SUPERADMIN_EMAIL") || "chelelgorotichvictor2604@gmail.com";
    let targetUser = users.find(user => user.email === email);

    if (!targetUser) {
      if (email === allowedEmail) {
        console.log("Super admin email not found. Auto-provisioning:", email);
        const { data: created, error: createErr } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
        });

        if (createErr || !created?.user) {
          console.error("Error creating super admin user:", createErr);
          return new Response(
            JSON.stringify({ error: "Failed to create super admin user" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        targetUser = created.user;

        // Ensure the super_admin role exists for this user
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: targetUser.id, role: "super_admin" });

        if (roleErr) {
          // Ignore duplicate errors; log others
          console.warn("Role assignment issue (may be duplicate):", roleErr);
        }
      } else {
        console.log("Email not registered:", email);
        return new Response(
          JSON.stringify({ 
            error: "This email is not registered. Contact your administrator." 
          }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log("Generating magic link for:", email);

    // Generate OTP/magic link using Supabase Auth
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `https://elmaschoolonline.lovable.app/auth/callback`,
      }
    });

    if (error) {
      console.error("Error generating magic link:", error);
      return new Response(
        JSON.stringify({ error: "Failed to send magic link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Magic link generated successfully for:", email);

    // In a production environment, you would send this link via email
    // For now, we'll return it in the response (remove this in production)
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Magic link sent to your email",
        // Remove this in production - only for testing
        magicLink: data.properties?.action_link
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-magic-link function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
