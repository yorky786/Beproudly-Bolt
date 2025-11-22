import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface LikeRequest {
  likedUserId: string;
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

    const { likedUserId }: LikeRequest = await req.json();

    if (!likedUserId) {
      return new Response(
        JSON.stringify({ error: 'Missing liked user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (likedUserId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot like yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: rateLimit, error: rateLimitError } = await supabaseAdmin.rpc(
      'check_rate_limit',
      {
        p_user_id: user.id,
        p_action: 'like_profile',
        p_max_attempts: 50,
        p_window_minutes: 1,
      }
    );

    if (rateLimitError || !rateLimit) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: validAction } = await supabaseAdmin.rpc(
      'validate_user_action',
      {
        p_user_id: user.id,
        p_target_user_id: likedUserId,
      }
    );

    if (!validAction) {
      return new Response(
        JSON.stringify({ error: 'Cannot interact with this user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { data: like, error: likeError } = await supabase
        .from('likes')
        .insert({
          liker_id: user.id,
          liked_id: likedUserId,
        })
        .select()
        .single();

      if (likeError) {
        if (likeError.code === '23505') {
          return new Response(
            JSON.stringify({ error: 'Already liked this user' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw likeError;
      }

      const { data: reciprocalLike } = await supabase
        .from('likes')
        .select('*')
        .eq('liker_id', likedUserId)
        .eq('liked_id', user.id)
        .maybeSingle();

      let match = null;
      if (reciprocalLike) {
        const userIds = [user.id, likedUserId].sort();
        const { data: newMatch } = await supabase
          .from('matches')
          .insert({
            user1_id: userIds[0],
            user2_id: userIds[1],
            status: 'matched',
          })
          .select()
          .single();
        match = newMatch;
      }

      return new Response(
        JSON.stringify({ success: true, like, match }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (req.method === 'DELETE') {
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('liker_id', user.id)
        .eq('liked_id', likedUserId);

      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});