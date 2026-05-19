// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const businessId = url.searchParams.get('state')

    if (!code || !businessId) {
      return new Response('Faltan parámetros', { status: 400 })
    }

    const MP_APP_ID = Deno.env.get('MP_APP_ID')
    const MP_CLIENT_SECRET = Deno.env.get('MP_CLIENT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!MP_APP_ID || !MP_CLIENT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      return new Response('Configuración incompleta', { status: 500 })
    }

    // 1. Intercambiar code por access_token
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: MP_APP_ID,
        client_secret: MP_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${SUPABASE_URL}/functions/v1/mp-oauth-callback`,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('MP OAuth error:', tokenData)
      return Response.redirect('unpique://mp-error', 302)
    }

    // 2. Guardar en businesses
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const { error } = await supabase
      .from('businesses')
      .update({
        mercadopago_access_token: tokenData.access_token,
        mercadopago_public_key: tokenData.public_key || null,
        mercadopago_user_id: String(tokenData.user_id || ''),
        mercadopago_connected: true,
        mercadopago_connected_at: new Date().toISOString(),
      })
      .eq('id', businessId)

    if (error) {
      console.error('Supabase error:', error)
      return Response.redirect('unpique://mp-error', 302)
    }

    // 3. Redirigir a la app
    return Response.redirect('unpique://mp-connected', 302)

  } catch (err) {
    console.error('OAuth error:', err)
    return Response.redirect('unpique://mp-error', 302)
  }
})
