import { supabase } from './supabaseClient.js'

// The extraction endpoint spends Anthropic credits, so only logged-in users of
// this app may call it. The browser sends its Supabase access token as a
// Bearer token; we ask Supabase whether it belongs to a real user.
export async function isAuthorized(authorizationHeader) {
  if (!supabase) {
    console.error('SUPABASE_URL / SUPABASE_ANON_KEY are not set; rejecting request')
    return false
  }
  if (typeof authorizationHeader !== 'string' || !authorizationHeader.startsWith('Bearer ')) return false
  const token = authorizationHeader.slice('Bearer '.length)
  const { data, error } = await supabase.auth.getUser(token)
  return !error && Boolean(data.user)
}
