import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateRegistryRequest {
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

    const { email }: ValidateRegistryRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check staff registry first
    const { data: staffData, error: staffError } = await supabase
      .from("staff_registry")
      .select("id, email, role, status")
      .eq("email", email)
      .eq("status", "active")
      .maybeSingle();

    if (staffError && staffError.code !== 'PGRST116') throw staffError;

    if (staffData) {
      return new Response(
        JSON.stringify({
          valid: true,
          type: "staff",
          role: staffData.role,
          registryId: staffData.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check student registry
    const { data: studentData, error: studentError } = await supabase
      .from("students_data")
      .select("id, email, approval_status")
      .eq("email", email)
      .eq("approval_status", "approved")
      .maybeSingle();

    if (studentError && studentError.code !== 'PGRST116') throw studentError;

    if (studentData) {
      return new Response(
        JSON.stringify({
          valid: true,
          type: "student",
          role: "student",
          registryId: studentData.id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Last check: see if user exists in profiles table (for super_admins and other users created directly)
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("id", `%${email.split('@')[0]}%`)
      .maybeSingle();

    // Actually, let's check user_roles by getting all users and finding the one with this email
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (!usersError && users) {
      const matchingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (matchingUser) {
        // Check if this user has a role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", matchingUser.id)
          .maybeSingle();

        if (!roleError && roleData) {
          return new Response(
            JSON.stringify({
              valid: true,
              type: "existing_user",
              role: roleData.role
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Not found in any registry or existing users
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Email not registered or pending approval"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
