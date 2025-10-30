import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Simple test response
  if (req.url === '/' || req.url === '/api/health') {
    return res.status(200).json({
      status: 'ok',
      message: 'Vercel function is working!',
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }
  
  // For now, return a placeholder for other routes
  return res.status(200).json({
    status: 'ok',
    message: 'Function working, full app loading...',
    url: req.url,
    method: req.method
  });
}
