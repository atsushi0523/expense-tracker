import { supabase } from '../server/supabaseClient.js'

// Called daily by Vercel Cron (see vercel.json). Supabase pauses free-plan
// projects after about a week without activity; a tiny query keeps it awake
// even when nobody opens the app. RLS means the anon query returns no rows,
// but it still reaches the database, which is all that matters here.
export default async function handler(req, res) {
  // Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  if (!supabase) {
    res.status(500).json({ error: 'Supabase env vars are not set' })
    return
  }

  const { error } = await supabase.from('profiles').select('id').limit(1)
  if (error) {
    console.error(error)
    res.status(500).json({ error: 'keep-alive query failed' })
    return
  }

  res.status(200).json({ ok: true, at: new Date().toISOString() })
}
