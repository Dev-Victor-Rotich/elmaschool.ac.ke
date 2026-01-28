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
    const { fullName, password } = await req.json()

    if (!fullName || !password) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Full name and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Find student by full_name (case-insensitive)
    const { data: student, error } = await supabaseClient
      .from('students_data')
      .select('id, full_name, admission_number, email, user_id, approval_status')
      .ilike('full_name', fullName.trim())
      .maybeSingle()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ valid: false, message: 'Login failed. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!student) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Student not found. Please check your name.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if student is approved
    if (student.approval_status !== 'approved') {
      return new Response(
        JSON.stringify({ valid: false, message: 'Your account is pending approval' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if student has an email (required for login)
    if (!student.email) {
      return new Response(
        JSON.stringify({ valid: false, message: 'No email associated with this account. Please contact admin.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract last name from full_name (last word)
    const nameParts = student.full_name.trim().split(' ')
    const lastName = nameParts[nameParts.length - 1].toUpperCase()

    // Build expected password: LASTNAME + admission_number
    const expectedPassword = lastName + student.admission_number

    // Compare password (case-insensitive for flexibility)
    if (password.toUpperCase() !== expectedPassword) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Wrong password' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate magic link token for direct authentication
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: student.email,
    })

    if (linkError || !linkData) {
      console.error('Error generating magic link:', linkError)
      return new Response(
        JSON.stringify({ valid: false, message: 'Login failed. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the actual token from the action_link URL
    const actionLink = linkData.properties.action_link
    const url = new URL(actionLink)
    const token = url.searchParams.get('token')

    if (!token) {
      console.error('No token found in action link')
      return new Response(
        JSON.stringify({ valid: false, message: 'Login failed. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        email: student.email,
        token: token,
        userId: student.user_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in student-quick-login:', error)
    return new Response(
      JSON.stringify({ valid: false, message: 'Login failed. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
