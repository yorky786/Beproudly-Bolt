import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ReportRequest {
  reportedUserId: string;
  reason: 'harassment' | 'inappropriate_content' | 'spam' | 'fake_profile' | 'other';
  details?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const reportData: ReportRequest = await req.json();

    if (!reportData.reportedUserId || !reportData.reason) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validReasons = ['harassment', 'inappropriate_content', 'spam', 'fake_profile', 'other'];
    if (!validReasons.includes(reportData.reason)) {
      return new Response(
        JSON.stringify({ error: 'Invalid reason' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (reportData.reportedUserId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot report yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: rateLimit, error: rateLimitError } = await supabaseAdmin.rpc(
      'check_rate_limit',
      {
        p_user_id: user.id,
        p_action: 'submit_report',
        p_max_attempts: 5,
        p_window_minutes: 60,
      }
    );

    if (rateLimitError || !rateLimit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('reported_id', reportData.reportedUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingReport) {
      return new Response(
        JSON.stringify({ error: 'You have already reported this user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        reported_id: reportData.reportedUserId,
        reason: reportData.reason,
        details: reportData.details || null,
        status: 'pending',
      })
      .select()
      .single();

    if (reportError) {
      return new Response(
        JSON.stringify({ error: 'Failed to submit report' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    await supabaseAdmin.from('security_events').insert({
      user_id: reportData.reportedUserId,
      event_type: 'user_reported',
      severity: reportData.reason === 'harassment' ? 'high' : 'medium',
      description: `User reported for: ${reportData.reason}`,
      metadata: {
        reporter_id: user.id,
        report_id: report.id,
        reason: reportData.reason,
      },
    });

    return new Response(
      JSON.stringify({ success: true, report }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});