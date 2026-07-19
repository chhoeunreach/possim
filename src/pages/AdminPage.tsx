import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader, PageContainer } from "@/components/layout/Layout"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"
import { i18n } from "@/lib/i18n"
import { fmt, escapeHtml } from "@/lib/utils"
import { useToast } from "@/hooks/useToast"
import { ToastContainer } from "@/components/ui/toast"
import { Modal, ConfirmModal } from "@/components/ui/modal"
import { Pagination } from "@/components/ui/pagination"
import type { Shift, Transaction, ActivityLog, User } from "@/types"
import { Plus, Search, RefreshCw, Shield, Users, Filter } from "lucide-react"

const BRANCHES = [
  { value: "", label: "All Branches" },
  { value: "កម្ពុជាក្រោម", label: "កម្ពុជាក្រោម" },
  { value: "វីអាយភី", label: "វីអាយភី" },
  { value: "អ៊ីអន", label: "អ៊ីអន" },
  { value: "កាប់គោ", label: "កាប់គោ" },
]

type AdminTab = 'shifts' | 'transactions' | 'logs'

export function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toasts, showToast, removeToast } = useToast()

  const [activeTab, setActiveTab] = useState<AdminTab>('shifts')
  const [branchFilter, setBranchFilter] = useState("")

  const [shifts, setShifts] = useState<Shift[]>([])
  const [shiftsLoading, setShiftsLoading] = useState(false)
  const [shiftsPage, setShiftsPage] = useState(1)
  const [shiftsTotal, setShiftsTotal] = useState(0)

  const [txns, setTxns] = useState<Transaction[]>([])
  const [txnsLoading, setTxnsLoading] = useState(false)
  const [txnsPage, setTxnsPage] = useState(1)
  const [txnsTotal, setTxnsTotal] = useState(0)

  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsPage, setLogsPage] = useState(1)
  const [logsTotal, setLogsTotal] = useState(0)

  // Users
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Create user
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newRole, setNewRole] = useState("staff")

  // Edit / Delete user
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editUsername, setEditUsername] = useState("")
  const [editRole, setEditRole] = useState("staff")
  const [editPassword, setEditPassword] = useState("")
  const [editLoading, setEditLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadShifts = useCallback(async (page = 1) => {
    setShiftsLoading(true)
    try {
      const res = await api.getAdminShifts(page, 50, branchFilter || undefined)
      setShifts(res.data)
      setShiftsTotal(res.total)
      setShiftsPage(res.page)
    } catch { showToast('Failed to load shifts', 'error') }
    finally { setShiftsLoading(false) }
  }, [branchFilter])

  const loadTxns = useCallback(async (page = 1) => {
    setTxnsLoading(true)
    try {
      const res = await api.getAdminTransactions(page)
      setTxns(res.data)
      setTxnsTotal(res.total)
      setTxnsPage(res.page)
    } catch { showToast('Failed to load transactions', 'error') }
    finally { setTxnsLoading(false) }
  }, [])

  const loadLogs = useCallback(async (page = 1) => {
    setLogsLoading(true)
    try {
      const res = await api.getAdminLogs(page)
      setLogs(res.data)
      setLogsTotal(res.total)
      setLogsPage(res.page)
    } catch { showToast('Failed to load logs', 'error') }
    finally { setLogsLoading(false) }
  }, [])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      setUsers(await api.getUsers())
    } catch { showToast('Failed to load users', 'error') }
    finally { setUsersLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'shifts') loadShifts(1)
    else if (activeTab === 'transactions') loadTxns(1)
    else if (activeTab === 'logs') loadLogs(1)
  }, [activeTab, loadShifts])

  const handleBranchFilter = (val: string) => {
    setBranchFilter(val)
    loadShifts(1)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername || !newPassword) {
      showToast(i18n.t('user.err.fields'), 'error')
      return
    }
    try {
      await api.createUser({
        username: newUsername,
        password: newPassword,
        role: newRole as 'staff' | 'admin',
      })
      showToast(i18n.t('user.ok.created', { name: newUsername, role: newRole }), 'success')
      setNewUsername("")
      setNewPassword("")
      setShowCreateForm(false)
      loadUsers()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Creation failed', 'error')
    }
  }

  const handleEditUser = async () => {
    if (!editTarget) return
    const body: Record<string, string> = { username: editUsername, role: editRole }
    if (editPassword.trim()) {
      if (editPassword.length < 4) { showToast(i18n.t('user.err.password'), 'error'); return }
      body.password = editPassword
    }
    setEditLoading(true)
    try {
      await api.updateUser(editTarget.id, body)
      showToast(i18n.t('user.ok.updated'), 'success')
      loadUsers()
      setEditTarget(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : i18n.t('user.err.update'), 'error')
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    if (user?.id === deleteTarget.id) {
      showToast(i18n.t('user.err.selfDel'), 'error')
      setDeleteTarget(null)
      return
    }
    setDeleteLoading(true)
    try {
      await api.deleteUser(deleteTarget.id)
      showToast(i18n.t('user.ok.deleted'), 'success')
      loadUsers()
      setDeleteTarget(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : i18n.t('user.err.delete'), 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const staffCount = users.filter(u => u.role === 'staff').length
  const filteredUsers = users.filter(u =>
    !searchQuery || u.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'shifts', label: i18n.t('admin.tab.shifts') },
    { id: 'transactions', label: i18n.t('admin.tab.txns') },
    { id: 'logs', label: i18n.t('admin.tab.logs') },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PageHeader
        title={i18n.t('admin.title')}
        gradient="purple"
        subtitle={user?.username ? `${user.username} (Admin)` : ''}
        onBack={() => navigate('/')}
      />

      <PageContainer>
        {/* Users Section */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{i18n.t('admin.manageStaff')}</p>
                  <p className="text-xs text-muted-foreground">{staffCount} staff accounts</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {i18n.t('admin.newStaff')}
              </Button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateUser} className="space-y-2 pt-3 border-t">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder={i18n.t('user.username.ph')}
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                  />
                  <Input
                    type="password"
                    placeholder={i18n.t('user.password.ph')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
                  >
                    <option value="staff">{i18n.t('user.role.staff')}</option>
                    <option value="admin">{i18n.t('user.role.admin')}</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    {i18n.t('admin.createUser')}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                    {i18n.t('admin.cancel')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="mb-4 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">{i18n.t('admin.users')}</p>
              <span className="text-xs text-muted-foreground">({users.length} accounts)</span>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={i18n.t('admin.search.ph')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs w-36"
                />
              </div>
              <Button variant="ghost" size="sm" className="h-8" onClick={loadUsers}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {usersLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{i18n.t('admin.empty')}</p>
          ) : (
            <div className="divide-y">
              {filteredUsers.map((u) => (
                <div key={u.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{escapeHtml(u.username)}</span>
                      <Badge variant={u.role === 'admin' ? 'purple' : 'secondary'} className="text-[10px] px-1.5 py-0">
                        {u.role}
                      </Badge>
                      {user?.id === u.id && (
                        <span className="text-xs text-purple-600 font-medium">(you)</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">ID: {u.id}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => { setEditTarget(u); setEditUsername(u.username); setEditRole(u.role); setEditPassword("") }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive"
                      disabled={user?.id === u.id}
                      onClick={() => setDeleteTarget(u)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Admin Tabs */}
        <div className="flex gap-0 mb-4 bg-card rounded-2xl border overflow-hidden shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground bg-card'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'shifts' && (
          <div>
            <Card className="mb-3">
              <CardContent className="p-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={branchFilter}
                  onChange={(e) => handleBranchFilter(e.target.value)}
                  className="flex-1 h-10 rounded-xl border border-input bg-background px-4 py-2 text-sm"
                >
                  {BRANCHES.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {shiftsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : shifts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">{i18n.t('admin.empty')}</p>
            ) : (
              <div className="space-y-2">
                {shifts.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{s.branch_name}</span>
                        <Badge variant={s.status === 'open' ? 'success' : 'secondary'}>
                          {s.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Staff: {s.staff_name || s.user_id}</span>
                        <span>{s.start_time}{s.end_time ? ` - ${s.end_time}` : ''}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                        <span>USD: {fmt(s.opening_usd, 'USD')} → {s.closing_usd !== null ? fmt(s.closing_usd, 'USD') : '—'}</span>
                        <span>KHR: {fmt(s.opening_khr, 'KHR')} → {s.closing_khr !== null ? fmt(s.closing_khr, 'KHR') : '—'}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Pagination page={shiftsPage} limit={50} total={shiftsTotal} onPageChange={loadShifts} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          txnsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : txns.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{i18n.t('admin.empty')}</p>
          ) : (
            <div className="space-y-2">
              {txns.map((t) => (
                <Card key={t.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${t.type === 'inflow' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {t.type} · {t.payment_method}
                            {t.branch_name && <span className="text-muted-foreground text-xs ml-1">· {t.branch_name}</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.timestamp}{t.staff_name ? ` · ${t.staff_name}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${t.type === 'inflow' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.type === 'inflow' ? '+' : '-'}{fmt(t.amount, t.currency as 'USD' | 'KHR')}
                        </p>
                        {t.invoice_url && (
                          <a href={t.invoice_url} target="_blank" className="text-xs text-primary hover:underline">View Invoice</a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Pagination page={txnsPage} limit={50} total={txnsTotal} onPageChange={loadTxns} />
            </div>
          )
        )}

        {activeTab === 'logs' && (
          logsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">{i18n.t('admin.empty')}</p>
          ) : (
            <Card className="divide-y">
              {logs.map((l) => (
                <div key={l.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{l.action}</p>
                      {l.details && <p className="text-xs text-muted-foreground mt-0.5">{l.details}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-purple-600 font-medium">{l.username}</span>
                        <span className="text-xs text-muted-foreground">{l.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          )
        )}
        {activeTab === 'logs' && (logs.length > 0) && (
          <Pagination page={logsPage} limit={50} total={logsTotal} onPageChange={loadLogs} />
        )}

        <div className="mt-4">
          <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>
            {i18n.t('admin.backStaff.full')}
          </Button>
        </div>
      </PageContainer>

      {/* Edit User Modal */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title={`Edit User #${editTarget?.id || ''}`}
      >
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Username</label>
            <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Role</label>
            <select
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={editRole}
              onChange={e => setEditRole(e.target.value)}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">New Password (leave empty to keep current)</label>
            <Input value={editPassword} onChange={e => setEditPassword(e.target.value)} type="password" placeholder="optional" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setEditTarget(null)} disabled={editLoading}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleEditUser} disabled={editLoading || !editUsername.trim()}>
              {editLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={deleteTarget ? `Delete user "${deleteTarget.username}" (#${deleteTarget.id})? This cannot be undone.` : ''}
        confirmLabel="Delete"
        confirmVariant="destructive"
        loading={deleteLoading}
      />
    </div>
  )
}
