import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fullName, admissionNumber } = await req.json()

    if (!fullName || !admissionNumber) {
      return new Response(
        JSON.stringify({ error: 'Full name and admission number are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate student exists without exposing sensitive data
    const { data, error } = await supabaseClient
      .from('students_data')
      .select('id, is_registered')
      .eq('full_name', fullName)
      .eq('admission_number', admissionNumber)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      return new Response(
        JSON.stringify({ valid: false, message: 'No matching student data found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (data.is_registered) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Student already registered' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return only the student ID - no sensitive data
    return new Response(
      JSON.stringify({ valid: true, studentId: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})