import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyStaffRequest {
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fullName, idNumber, phone, email }: VerifyStaffRequest = await req.json();

    console.log('Verifying staff:', { fullName, idNumber, phone, email });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if staff exists in registry
    const { data: staff, error } = await supabase
      .from('staff_registry')
      .select('id, role')
      .eq('full_name', fullName)
      .eq('id_number', idNumber)
      .eq('phone', phone)
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.error('Error checking staff registry:', error);
      return new Response(
        JSON.stringify({ valid: false, message: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!staff) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Your data is not registered by the school.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ valid: true, registryId: staff.id, role: staff.role }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-staff function:', error);
    return new Response(
      JSON.stringify({ valid: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});