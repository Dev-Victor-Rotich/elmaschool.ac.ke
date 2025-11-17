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

    console.log("Validating registry for email:", email);

    // Check staff registry first
    const { data: staffData, error: staffError } = await supabase
      .from("staff_registry")
      .select("id, email, role, status")
      .eq("email", email)
      .eq("status", "active")
      .maybeSingle();

    if (staffError && staffError.code !== 'PGRST116') {
      console.error("Staff registry check error:", staffError);
      throw staffError;
    }

    if (staffData) {
      console.log("Found in staff registry:", staffData.role);
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

    if (studentError && studentError.code !== 'PGRST116') {
      console.error("Student registry check error:", studentError);
      throw studentError;
    }

    if (studentData) {
      console.log("Found in student registry");
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

    // Not found in any registry
    console.log("Email not found in any registry or not approved");
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Email not registered or pending approval"
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Registry validation error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
