// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { Resend } from "npm:resend@2.0.0"

// @ts-ignore
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fullName, email, phone, address, notes, passportUrl, billUrl, companyName } = await req.json()

    const { data, error } = await resend.emails.send({
      from: 'ATA Portal <onboarding@resend.dev>',
      to: ['companyscanfiles@gmail.com'], 
      // KONU BAŞLIĞINDA FİRMA İSMİ YAZAR, KARIŞMAZ
      subject: `Yeni Başvuru: ${companyName}`, 
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Yeni Şirket Başvurusu</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Firma İsmi:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${companyName}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Başvuran Ad Soyad:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${fullName}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${email}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Telefon:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${phone || '-'}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Adres:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${address || '-'}</td></tr>
            <tr><td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Notlar:</td><td style="padding: 10px; border-bottom: 1px solid #eee;">${notes || '-'}</td></tr>
          </table>

          <div style="margin-top: 30px; display: flex; gap: 10px;">
            <a href="${passportUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Pasaportu Görüntüle</a>
            <a href="${billUrl}" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Faturayı Görüntüle</a>
          </div>
        </div>
      `
    })

    if (error) {
      console.error('Resend Hatası:', error)
      return new Response(JSON.stringify({ error }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 })
  }
})