import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "npm:resend@2.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS izni (Tarayıcıdan gelen istekler için)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Frontend'den gelen veriyi al
    const { fullName, email, phone, notes, passportUrl } = await req.json()

    // Maili gönder
    const { data, error } = await resend.emails.send({
      from: 'ATA Portal <onboarding@resend.dev>', // Resend onaylı domainin yoksa bunu değiştirme
      to: ['contact@ataaccountancy.com'], // Mailin gideceği adres
      subject: `Yeni Pasaport Başvurusu: ${fullName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Yeni Pasaport Başvurusu</h2>
          <p>Web sitesinden yeni bir başvuru alındı. Detaylar aşağıdadır:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Ad Soyad:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Telefon:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${phone || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Notlar:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${notes || '-'}</td>
            </tr>
          </table>

          <div style="margin-top: 30px; text-align: center;">
            <a href="${passportUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Pasaportu Görüntüle
            </a>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Link çalışmazsa: <a href="${passportUrl}">${passportUrl}</a>
            </p>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Resend Hatası:', error)
      return new Response(JSON.stringify({ error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})