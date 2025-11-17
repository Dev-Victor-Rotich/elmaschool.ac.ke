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

    // Check super admin first
    const allowedEmail = Deno.env.get("SUPERADMIN_EMAIL") || "chelelgorotichvictor2604@gmail.com";
    
    // Check if user exists in auth.users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to verify email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let targetUser = users.find(user => user.email === email);
    let userRole = null;

    // If user doesn't exist, check registries
    if (!targetUser) {
      // Check staff registry
      const { data: staffData } = await supabase
        .from("staff_registry")
        .select("role, status")
        .eq("email", email)
        .eq("status", "active")
        .maybeSingle();

      if (staffData) {
        console.log("Found in staff registry:", staffData.role);
        userRole = staffData.role;
      } else {
        // Check student registry
        const { data: studentData } = await supabase
          .from("students_data")
          .select("id, approval_status")
          .eq("email", email)
          .eq("approval_status", "approved")
          .maybeSingle();

        if (studentData) {
          console.log("Found in student registry");
          userRole = "student";
        } else if (email === allowedEmail) {
          console.log("Super admin email");
          userRole = "super_admin";
        } else {
          console.log("Email not found in any registry or not approved");
          return new Response(
            JSON.stringify({ 
              error: "Email not registered or pending approval. Contact your administrator." 
            }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Create user
      console.log("Creating user for:", email, "with role:", userRole);
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (createErr || !created?.user) {
        console.error("Error creating user:", createErr);
        return new Response(
          JSON.stringify({ error: "Failed to create user account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      targetUser = created.user;

      // Assign role
      const { error: roleErr } = await supabase
        .from("user_roles")
        .insert({ user_id: targetUser.id, role: userRole });

      if (roleErr) {
        console.warn("Role assignment issue:", roleErr);
      }

      // Update registry with user_id if student
      if (userRole === "student") {
        await supabase
          .from("students_data")
          .update({ user_id: targetUser.id, is_registered: true })
          .eq("email", email);
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
