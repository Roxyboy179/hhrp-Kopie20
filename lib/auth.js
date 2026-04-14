import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production'

/**
 * Erstellt ein JWT Token
 */
export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verifiziert ein JWT Token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Extrahiert Token aus Authorization Header
 */
export function extractToken(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * Middleware: Prüft ob Request authentifiziert ist
 */
export function requireAuth(request) {
  const token = extractToken(request)
  if (!token) {
    return { authorized: false, user: null }
  }
  
  const user = verifyToken(token)
  if (!user) {
    return { authorized: false, user: null }
  }
  
  return { authorized: true, user }
}
