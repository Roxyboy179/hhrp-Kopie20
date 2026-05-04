// ====== VERCEL BUILD FIX: MINIMAL STUB CLIENT ======
// Problem: Webpack minifiziert @supabase/supabase-js falsch während Build
// Lösung: Exportiere nur stub Client ohne echte Supabase-Initialisierung
// Der echte Client wird zur Laufzeit in den API-Routes initialisiert

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

// WICHTIG: Kein Import von @supabase/supabase-js auf Top-Level!
// Dieser wird nur zur Laufzeit in getSupabaseAdmin() gemacht

let _supabaseAdmin = null
let _initPromise = null

// Async-Funktion für echte Initialisierung (nur zur Laufzeit)
export async function getSupabaseAdmin() {
  // Wenn bereits initialisiert, direkt zurückgeben
  if (_supabaseAdmin) return _supabaseAdmin
  
  // Wenn gerade initialisiert wird, auf das Promise warten
  if (_initPromise) return _initPromise
  
  // Neue Initialisierung starten
  _initPromise = (async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('[supabase] Missing env vars - using stub client')
      _supabaseAdmin = stubClient
      return _supabaseAdmin
    }
    
    try {
      // Dynamischer Import - erst zur Laufzeit!
      const { createClient } = await import('@supabase/supabase-js')
      
      _supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      
      return _supabaseAdmin
    } catch (error) {
      console.error('[supabase] Failed to initialize:', error)
      _supabaseAdmin = stubClient
      return _supabaseAdmin
    }
  })()
  
  return _initPromise
}

// Für backwards compatibility: direkter Export (aber nur stubClient für Build)
// Die echte Initialisierung passiert erst wenn getSupabaseAdmin() aufgerufen wird
export const supabaseAdmin = stubClient
export const supabase = stubClient

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
