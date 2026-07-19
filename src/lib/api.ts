import type {
  AuthResponse,
  Shift,
  Transaction,
  ActivityLog,
  User,
  CreateShiftPayload,
  CreateTransactionPayload,
  CloseShiftPayload,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/types'

const TOKEN_KEY = 'pos_token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown
): Promise<T> {
  const token = getToken()
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (token) {
    (opts.headers as Record<string, string>)['Authorization'] = 'Bearer ' + token
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  if (res.status === 401 || res.status === 403) {
    clearToken()
    throw new Error('Session expired. Please login again.')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data as T
}

export const api = {
  login(username: string, password: string) {
    return request<AuthResponse>('POST', '/api/auth/login', { username, password })
  },

  getShifts() {
    return request<Shift[]>('GET', '/api/shifts')
  },

  getCurrentShift() {
    return request<Shift | null>('GET', '/api/shifts/current')
  },

  getShift(id: number) {
    return request<Shift>('GET', '/api/shifts/' + id)
  },

  getTransactions(shiftId: number) {
    return request<Transaction[]>('GET', '/api/shifts/' + shiftId + '/transactions')
  },

  createShift(data: CreateShiftPayload) {
    return request<Shift>('POST', '/api/shifts', data)
  },

  createTransaction(data: CreateTransactionPayload) {
    return request<Transaction>('POST', '/api/transactions', data)
  },

  closeShift(id: number, data: CloseShiftPayload) {
    return request<Shift>('PUT', '/api/shifts/' + id + '/close', data)
  },

  getAdminShifts(page = 1, limit = 50, branch?: string) {
    let url = `/api/admin/shifts?page=${page}&limit=${limit}`
    if (branch) url += '&branch=' + encodeURIComponent(branch)
    return request<{ data: Shift[]; total: number; page: number; limit: number }>('GET', url)
  },

  getAdminTransactions(page = 1, limit = 50) {
    return request<{ data: Transaction[]; total: number; page: number; limit: number }>('GET', `/api/admin/transactions?page=${page}&limit=${limit}`)
  },

  getAdminLogs(page = 1, limit = 50) {
    return request<{ data: ActivityLog[]; total: number; page: number; limit: number }>('GET', `/api/admin/logs?page=${page}&limit=${limit}`)
  },

  createUser(data: CreateUserPayload) {
    return request<User>('POST', '/api/admin/users', data)
  },

  getUsers() {
    return request<User[]>('GET', '/api/admin/users')
  },

  updateUser(id: number, data: UpdateUserPayload) {
    return request<User>('PUT', '/api/admin/users/' + id, data)
  },

  deleteUser(id: number) {
    return request<{ ok: boolean }>('DELETE', '/api/admin/users/' + id)
  },

  changePassword(currentPassword: string, newPassword: string) {
    return request<{ message: string }>('PUT', '/api/auth/password', { current_password: currentPassword, new_password: newPassword })
  },

  async uploadInvoice(file: File): Promise<{ url: string }> {
    const token = getToken()
    const fd = new FormData()
    fd.append('invoice', file)
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: fd,
    })
    if (res.status === 401 || res.status === 403) {
      clearToken()
      throw new Error('Session expired. Please login again.')
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data
  },
}

export { getToken, setToken, clearToken }
