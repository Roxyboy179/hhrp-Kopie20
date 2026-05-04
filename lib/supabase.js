import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Minimaler Stub-Query-Builder – wird benutzt falls Env-Vars fehlen,
// damit der Build (Next.js "Collecting page data") nicht fehlschlägt.
// KEIN Proxy (hat auf Vercel zu Minifier-Problemen geführt).
const stubError = {
  data: null,
  error: new Error('Supabase ist nicht konfiguriert (Env-Vars fehlen)'),
}

function stubResponse() {
  return Promise.resolve(stubError)
}

const stubQuery = {
  select: () => stubQuery,
  insert: () => stubQuery,
  update: () => stubQuery,
  upsert: () => stubQuery,
  delete: () => stubQuery,
  eq: () => stubQuery,
  neq: () => stubQuery,
  gt: () => stubQuery,
  gte: () => stubQuery,
  lt: () => stubQuery,
  lte: () => stubQuery,
  like: () => stubQuery,
  ilike: () => stubQuery,
  in: () => stubQuery,
  is: () => stubQuery,
  or: () => stubQuery,
  and: () => stubQuery,
  not: () => stubQuery,
  order: () => stubQuery,
  limit: () => stubQuery,
  range: () => stubQuery,
  single: () => stubResponse(),
  maybeSingle: () => stubResponse(),
  then: (resolve) => resolve(stubError),
}

const stubClient = {
  from: () => stubQuery,
  rpc: () => stubResponse(),
  auth: {
    getUser: stubResponse,
    getSession: stubResponse,
    signIn: stubResponse,
    signOut: stubResponse,
    signUp: stubResponse,
  },
  storage: {
    from: () => ({
      upload: stubResponse,
      download: stubResponse,
      list: stubResponse,
      remove: stubResponse,
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
  channel: () => ({
    on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    subscribe: () => ({ unsubscribe: () => {} }),
  }),
  removeChannel: () => {},
}

// ====== LAZY LOADING PATTERN (FIX FÜR VERCEL BUILD) ======
// Statt direktem Export wird der Client erst bei Bedarf initialisiert.
// Dies verhindert Webpack-Minification-Fehler während "Collecting page data".
let _supabaseAdmin = null

export function getSupabaseAdmin() {
  if (_supabaseAdmin) return _supabaseAdmin
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[supabase] Missing env vars - using stub client')
    _supabaseAdmin = stubClient
    return _supabaseAdmin
  }
  
  _supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  
  return _supabaseAdmin
}

// Backward compatibility exports
export const supabaseAdmin = getSupabaseAdmin()
export const supabase = supabaseAdmin

// Helper: Parse formData if it's a string
export function parseFormData(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error('Failed to parse formData:', e)
      return {}
    }
  }
  return data || {}
}

// Helper: Convert snake_case to camelCase
export function toCamelCase(obj) {
  if (!obj) return obj
  
  const camelObj = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    
    // Special handling for formData
    if (camelKey === 'formData') {
      camelObj[camelKey] = parseFormData(value)
    } else {
      camelObj[camelKey] = value
    }
  }
  return camelObj
}

// Helper: Parse formData if it's a string
export function parseFormData(data) {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch (e) {
      console.error('Failed to parse formData:', e)
      return {}
    }
  }
  return data || {}
}

// Helper: Convert snake_case to camelCase
export function toCamelCase(obj) {
  if (!obj) return obj
  
  const camelObj = {}
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    
    // Special handling for formData
    if (camelKey === 'formData') {
      camelObj[camelKey] = parseFormData(value)
    } else {
      camelObj[camelKey] = value
    }
  }
  return camelObj
}
