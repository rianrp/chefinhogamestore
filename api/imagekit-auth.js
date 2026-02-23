// Vercel Serverless Function - ImageKit Authentication
// Gera token, expire e signature para upload seguro
import crypto from 'crypto';

export default async function handler(req, res) {
  // Permitir apenas GET e POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ler private key do ambiente (OBRIGATÓRIO)
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    
    if (!privateKey) {
      console.error('❌ IMAGEKIT_PRIVATE_KEY não configurado');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Gerar token único
    const token = crypto.randomUUID();
    
    // Expiração: 10 minutos a partir de agora (unix timestamp em segundos)
    const expire = Math.floor(Date.now() / 1000) + (10 * 60);
    
    // Gerar signature: HMAC-SHA1(privateKey, token + expire)
    const signature = crypto
      .createHmac('sha1', privateKey)
      .update(token + expire)
      .digest('hex');

    // Retornar credenciais temporárias
    res.status(200).json({
      token,
      expire,
      signature,
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY || ''
    });

  } catch (error) {
    console.error('❌ Erro ao gerar auth ImageKit:', error);
    res.status(500).json({ error: 'Failed to generate auth' });
  }
}
