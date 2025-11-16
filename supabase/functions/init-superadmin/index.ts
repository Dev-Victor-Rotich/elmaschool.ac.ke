import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InitSuperAdminRequest {
  email: string;
  secret: string;
}

const INIT_SECRET = Deno.env.get("SUPERADMIN_INIT_SECRET") || "change-me-in-production";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, secret }: InitSuperAdminRequest = await req.json();

    if (secret !== INIT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Invalid secret" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Initializing SuperAdmin:", email);

    // Check if user already exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log("User already exists:", userId);
    } else {
      // Create the SuperAdmin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: {
          full_name: "Super Administrator",
        }
      });

      if (createError) {
        console.error("Error creating user:", createError);
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      userId = newUser.user.id;
      console.log("Created new user:", userId);
    }

    // Check if role already exists
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .single();

    if (!existingRole) {
      // Assign super_admin role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: "super_admin"
        });

      if (roleError) {
        console.error("Error assigning role:", roleError);
        return new Response(
          JSON.stringify({ error: "Failed to assign super_admin role" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Assigned super_admin role");
    } else {
      console.log("super_admin role already exists");
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ 
        approval_status: "approved",
        approved_at: new Date().toISOString()
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "SuperAdmin initialized successfully",
        userId: userId
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in init-superadmin function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
