import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  email: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: SendOTPRequest = await req.json();

    console.log('Sending OTP to:', email);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check rate limiting - max 5 OTPs per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOTPs, error: countError } = await supabase
      .from('otp_codes')
      .select('id')
      .eq('email', email)
      .gte('created_at', oneHourAgo);

    if (countError) {
      console.error('Error checking rate limit:', countError);
    }

    if (recentOTPs && recentOTPs.length >= 5) {
      return new Response(
        JSON.stringify({ success: false, message: 'Too many OTP requests. Please try again in an hour.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        email,
        otp,
        expires_at: expiresAt,
        verified: false,
        attempts: 0
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        
        const { error: emailError } = await resend.emails.send({
          from: 'School Portal <onboarding@resend.dev>',
          to: [email],
          subject: 'Your School Portal Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Welcome to School Portal</h2>
              <p style="font-size: 16px;">Your verification code is:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
                ${otp}
              </div>
              <p style="color: #666;">This code will expire in 5 minutes.</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          `,
        });
        
        if (emailError) {
          console.error('Failed to send email via Resend:', emailError);
          return new Response(
            JSON.stringify({ success: false, message: 'Failed to send OTP email' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('OTP email sent successfully to:', email);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        return new Response(
          JSON.stringify({ success: false, message: 'Failed to send OTP email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.warn('RESEND_API_KEY not configured, OTP:', otp);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully to your email'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-otp function:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});