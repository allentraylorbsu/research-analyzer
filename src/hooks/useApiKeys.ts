/**
 * useApiKeys Hook
 * Manages API key storage, validation, and persistence
 */

import { useState, useEffect, useCallback } from 'react'
import type { ApiKeys, ConnectionStatus } from '@/types'
import { initializeSupabase } from '@/services/supabase'
import { testConnection as testOpenAI } from '@/services/openai'

const STORAGE_KEY = 'research-analyzer-api-keys'

interface UseApiKeysReturn {
  apiKeys: ApiKeys | null
  connectionStatus: ConnectionStatus
  isLoading: boolean
  error: string | null
  setApiKeys: (keys: ApiKeys) => void
  testConnections: () => Promise<void>
  clearApiKeys: () => void
  hasValidOpenAI: boolean
  hasValidSupabase: boolean
  hasValidLegiscan: boolean
}

/**
 * Hook for managing API keys with localStorage persistence
 */
export function useApiKeys(): UseApiKeysReturn {
  const [apiKeys, setApiKeysState] = useState<ApiKeys | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    openai: { connected: false, message: 'Not tested' },
    supabase: { connected: false, message: 'Not tested' },
    legiscan: { connected: false, message: 'Not tested' }
  })

  // Load keys from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ApiKeys
        setApiKeysState(parsed)
        // Auto-initialize Supabase if credentials exist
        if (parsed.supabaseUrl && parsed.supabaseKey) {
          initializeSupabase(parsed.supabaseUrl, parsed.supabaseKey)
        }
      } catch {
        console.error('Failed to parse stored API keys')
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    // Check for environment variables
    const envKeys: Partial<ApiKeys> = {}
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      envKeys.openaiKey = import.meta.env.VITE_OPENAI_API_KEY
    }
    if (import.meta.env.VITE_SUPABASE_URL) {
      envKeys.supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    }
    if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
      envKeys.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    }
    if (import.meta.env.VITE_LEGISCAN_API_KEY) {
      envKeys.legiscanKey = import.meta.env.VITE_LEGISCAN_API_KEY
    }

    if (Object.keys(envKeys).length > 0 && !stored) {
      const combinedKeys = {
        openaiKey: '',
        supabaseUrl: '',
        supabaseKey: '',
        ...envKeys
      } as ApiKeys
      setApiKeysState(combinedKeys)

      // Initialize Supabase if env vars provide credentials
      if (envKeys.supabaseUrl && envKeys.supabaseKey) {
        initializeSupabase(envKeys.supabaseUrl, envKeys.supabaseKey)
      }
    }
  }, [])

  const setApiKeys = useCallback((keys: ApiKeys) => {
    setApiKeysState(keys)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys))

    // Initialize Supabase if credentials provided
    if (keys.supabaseUrl && keys.supabaseKey) {
      initializeSupabase(keys.supabaseUrl, keys.supabaseKey)
    }
  }, [])

  const clearApiKeys = useCallback(() => {
    setApiKeysState(null)
    localStorage.removeItem(STORAGE_KEY)
    setConnectionStatus({
      openai: { connected: false, message: 'Not tested' },
      supabase: { connected: false, message: 'Not tested' },
      legiscan: { connected: false, message: 'Not tested' }
    })
  }, [])

  const testConnections = useCallback(async () => {
    if (!apiKeys) {
      setError('No API keys configured')
      return
    }

    setIsLoading(true)
    setError(null)

    const newStatus: ConnectionStatus = {
      openai: { connected: false, message: 'Testing...' },
      supabase: { connected: false, message: 'Testing...' },
      legiscan: { connected: false, message: 'Not configured' }
    }

    // Test OpenAI
    if (apiKeys.openaiKey) {
      try {
        const success = await testOpenAI(apiKeys.openaiKey)
        newStatus.openai = {
          connected: success,
          message: success ? 'Connected' : 'Connection failed',
          lastTested: new Date()
        }
      } catch (err) {
        newStatus.openai = {
          connected: false,
          message: err instanceof Error ? err.message : 'Connection failed',
          lastTested: new Date()
        }
      }
    } else {
      newStatus.openai = { connected: false, message: 'API key not provided' }
    }

    // Test Supabase
    if (apiKeys.supabaseUrl && apiKeys.supabaseKey) {
      try {
        initializeSupabase(apiKeys.supabaseUrl, apiKeys.supabaseKey)
        newStatus.supabase = {
          connected: true,
          message: 'Initialized',
          lastTested: new Date()
        }
      } catch (err) {
        newStatus.supabase = {
          connected: false,
          message: err instanceof Error ? err.message : 'Initialization failed',
          lastTested: new Date()
        }
      }
    } else {
      newStatus.supabase = { connected: false, message: 'Credentials not provided' }
    }

    // LegiScan just validates key format
    if (apiKeys.legiscanKey) {
      newStatus.legiscan = {
        connected: apiKeys.legiscanKey.length > 10,
        message: apiKeys.legiscanKey.length > 10 ? 'Key configured' : 'Invalid key format',
        lastTested: new Date()
      }
    }

    setConnectionStatus(newStatus)
    setIsLoading(false)
  }, [apiKeys])

  return {
    apiKeys,
    connectionStatus,
    isLoading,
    error,
    setApiKeys,
    testConnections,
    clearApiKeys,
    hasValidOpenAI: connectionStatus.openai.connected,
    hasValidSupabase: connectionStatus.supabase.connected,
    hasValidLegiscan: connectionStatus.legiscan?.connected || false
  }
}

export default useApiKeys
