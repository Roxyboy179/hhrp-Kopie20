import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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
