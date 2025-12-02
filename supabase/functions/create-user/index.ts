import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is a super admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: requestingUser } } = await supabaseAdmin.auth.getUser(token)
    
    if (!requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'super_admin')
      .single()

    if (!roles) {
      return new Response(
        JSON.stringify({ error: 'Only super admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, full_name, phone_number, id_number, role } = await req.json()

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone_number,
        id_number
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Failed to create user')

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        phone_number,
        id_number,
        status: 'pending'
      })

    if (profileError) throw profileError

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role
      })

    if (roleError) throw roleError

    // Also save to staff_registry for staff roles
    const staffRoles = ['super_admin', 'admin', 'bursar', 'chaplain', 'hod', 'teacher', 'librarian', 'classteacher']
    if (staffRoles.includes(role)) {
      const { error: staffError } = await supabaseAdmin
        .from('staff_registry')
        .insert({
          email,
          full_name,
          phone: phone_number,
          id_number,
          role,
          status: 'pending',
          created_by: requestingUser.id
        })
      
      if (staffError) {
        console.error('Failed to insert into staff_registry:', staffError)
      }
    }

    // Log the action
    await supabaseAdmin.rpc('log_admin_action', {
      p_action_type: 'create_user',
      p_target_user: authData.user.id,
      p_details: `Created user with email ${email} and role ${role}`
    })

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || 'An error occurred' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
