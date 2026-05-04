import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Stub-Client – wird bei fehlenden Env-Vars verwendet, damit der Build nicht
// fehlschlägt (z.B. bei Next.js "Collecting page data"). Alle Methoden werfen
// einen sprechenden Fehler beim tatsächlichen Aufruf.
function makeStub() {
  const err = () =>
    Promise.resolve({
      data: null,
      error: new Error('Supabase ist nicht konfiguriert (Env-Vars fehlen)'),
    })
  const chain = new Proxy(function () {}, {
    get: () => chain,
    apply: () => err(),
  })
  return chain
}

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : makeStub()

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
