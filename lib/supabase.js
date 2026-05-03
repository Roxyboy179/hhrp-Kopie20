import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Lazy-Init: Der Client wird erst beim ersten Zugriff erzeugt. Dadurch schlägt der
// Next.js "Collecting page data"-Schritt (Build) nicht fehl, wenn die Env-Vars
// in der Build-Umgebung fehlen (z.B. Vercel). Der Fehler tritt nur dann auf,
// wenn supabase wirklich verwendet wird – also zur Laufzeit.
let _supabaseClient = null
function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  _supabaseClient = createClient(supabaseUrl, supabaseKey)
  return _supabaseClient
}

// Proxy sorgt dafür, dass `supabase.from(...)`, `supabase.auth` etc. genau wie
// vorher funktionieren – der echte Client wird beim ersten Property-Access erzeugt.
export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getSupabaseClient()
      const value = client[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
    has(_target, prop) {
      return prop in getSupabaseClient()
    },
  }
)
export const supabaseAdmin = supabase // Alias für Kompatibilität

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
