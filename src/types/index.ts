export interface User {
  id: number
  username: string
  role: 'staff' | 'admin'
}

export interface Shift {
  id: number
  user_id: number
  branch_name: string
  start_time: string
  end_time: string | null
  opening_usd: number
  opening_khr: number
  closing_usd: number | null
  closing_khr: number | null
  status: 'open' | 'closed'
  opening_photo_url: string | null
  closing_photo_url: string | null
}

export interface Transaction {
  id: number
  shift_id: number
  type: 'inflow' | 'outflow'
  currency: 'USD' | 'KHR'
  payment_method: 'Cash' | 'Bank'
  amount: number
  cost: number
  invoice_url: string | null
  timestamp: string
  branch_name?: string
  staff_name?: string
}

export interface ActivityLog {
  id: number
  user_id: number
  action: string
  details: string
  timestamp: string
  username?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface CreateShiftPayload {
  branch_name: string
  opening_usd: number
  opening_khr: number
  opening_photo_url: string | null
}

export interface CreateTransactionPayload {
  shift_id: number
  type: 'inflow' | 'outflow'
  currency: 'USD' | 'KHR'
  payment_method: 'Cash' | 'Bank'
  amount: number
  cost: number
  invoice_url: string | null
}

export interface CloseShiftPayload {
  closing_usd: number
  closing_khr: number
  closing_photo_url: string | null
}

export interface CreateUserPayload {
  username: string
  password: string
  role: 'staff' | 'admin'
}

export interface UpdateUserPayload {
  username?: string
  password?: string
  role?: 'staff' | 'admin'
}
