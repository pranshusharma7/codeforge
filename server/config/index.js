import fs from 'fs';
import path from 'path';

// Load .env if present (native Node.js support)
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
} else {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          process.env[key.trim()] = rest.join('=').trim();
        }
      }
    }
  } catch {}
}

export const config = {
  port: parseInt(process.env.COLLAB_PORT || process.env.PORT || '4000', 10),
  host: process.env.COLLAB_HOST || '0.0.0.0',
  clientOrigins: process.env.CLIENT_ORIGINS
    ? process.env.CLIENT_ORIGINS.split(',').map((o) => o.trim())
    : ['http://localhost:8443', 'http://localhost:5173', 'http://localhost:3000', '*'],
  databaseUrl: process.env.DATABASE_URL || null,
  jwtSecret: process.env.JWT_SECRET || 'codeforge_collab_super_secret_jwt_key_2026',
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      ...(process.env.TURN_SERVER_URL
        ? [
            {
              urls: process.env.TURN_SERVER_URL,
              username: process.env.TURN_USERNAME || '',
              credential: process.env.TURN_CREDENTIAL || '',
            },
          ]
        : []),
    ],
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequestsPerWindow: 200,
  },
};

export default config;
