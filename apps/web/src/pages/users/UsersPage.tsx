import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  Users,
  X,
  Loader2,
  Save,
  Shield,
  Mail,
  Phone,
  Eye,
  EyeOff,
  UserPlus,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface UserItem {
  id: string;
  email: string;
  mobile: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  roles: { name: string; displayName: string }[];
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  displayNameTa?: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    password: '',
    roleIds: [] as string[],
  });

  const updateField = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRole = (roleId: string) => {
    setForm((prev) => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter((id) => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { page: 1, limit: 100 } });
      setUsers(res.data.data || []);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/users/roles');
      setRoles(res.data.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', email: '', mobile: '', password: '', roleIds: [] });
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error(t('users.requiredFields', 'Please fill all required fields'));
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/users', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        email: form.email.trim(),
        mobile: form.mobile.trim() || undefined,
        password: form.password,
        roleIds: form.roleIds.length > 0 ? form.roleIds : undefined,
      });
      toast.success(t('users.userCreated', 'User created successfully'));
      resetForm();
      setShowForm(false);
      fetchUsers();
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('common.error');
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: UserItem) => {
    setTogglingId(user.id);
    try {
      await api.put(`/users/${user.id}`, { isActive: !user.isActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      );
      toast.success(
        user.isActive
          ? t('users.userDeactivated', 'User deactivated')
          : t('users.userActivated', 'User activated')
      );
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('common.error');
      toast.error(msg);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('users.title', 'User Management')}</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} {t('common.results', 'users')}
          </p>
        </div>
        <Button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
          className={cn(
            'rounded-xl shadow-md',
            showForm ? 'bg-gray-600 hover:bg-gray-700' : 'bg-[#f26f31] hover:bg-[#c9531a]'
          )}
        >
          {showForm ? (
            <>
              <X className="mr-1.5 h-4 w-4" />
              {t('common.cancel', 'Cancel')}
            </>
          ) : (
            <>
              <Plus className="mr-1.5 h-4 w-4" />
              {t('users.addUser', 'Add User')}
            </>
          )}
        </Button>
      </div>

      {/* Add User Form */}
      {showForm && (
        <Card className="overflow-hidden shadow-md border-0">
          <div className="bg-gradient-to-r from-[#f26f31] to-[#c9531a] px-6 py-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t('users.addNewUser', 'Add New User')}
            </h2>
          </div>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {t('users.firstName', 'First Name')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder={t('users.firstNamePlaceholder', 'First name')}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">{t('users.lastName', 'Last Name')}</label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder={t('users.lastNamePlaceholder', 'Last name')}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-[#ACA9A9]" />
                    {t('common.email', 'Email')} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="user@example.com"
                    className="h-11 rounded-xl"
                    type="email"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-[#ACA9A9]" />
                    {t('common.mobile', 'Mobile')}
                  </label>
                  <Input
                    value={form.mobile}
                    onChange={(e) => updateField('mobile', e.target.value)}
                    placeholder="9876543210"
                    className="h-11 rounded-xl"
                    type="tel"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {t('users.password', 'Password')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Min 6 characters"
                      className="h-11 rounded-xl pr-10"
                      type={showPassword ? 'text' : 'password'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Roles Selection */}
              {roles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-[#ACA9A9]" />
                    {t('users.roles', 'Roles')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                          form.roleIds.includes(role.id)
                            ? 'bg-[#f26f31] text-white border-[#f26f31] shadow-sm'
                            : 'bg-background border-input text-muted-foreground hover:border-[#f26f31]/50'
                        )}
                      >
                        {role.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="rounded-xl"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#f26f31] hover:bg-[#c9531a] rounded-xl px-6 shadow-md"
                >
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {t('users.createUser', 'Create User')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="shadow-md border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-full bg-orange-50 flex items-center justify-center">
              <Users className="h-10 w-10 text-[#f26f31]/40" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{t('users.noUsers', 'No users found')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('users.noUsersDesc', 'Add your first team member to get started')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="shadow-md border-0 hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left text-xs text-muted-foreground">
                      <th className="p-4 font-medium">{t('users.name', 'Name')}</th>
                      <th className="p-4 font-medium">{t('common.email', 'Email')}</th>
                      <th className="p-4 font-medium">{t('common.mobile', 'Mobile')}</th>
                      <th className="p-4 font-medium">{t('users.roles', 'Role(s)')}</th>
                      <th className="p-4 font-medium">{t('common.status', 'Status')}</th>
                      <th className="p-4 font-medium">{t('users.lastLogin', 'Last Login')}</th>
                      <th className="p-4 font-medium text-right">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#f26f31]/20 to-orange-100 flex items-center justify-center text-sm font-bold text-[#f26f31]">
                              {(user.firstName?.[0] || '').toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{user.email}</td>
                        <td className="p-4 text-muted-foreground">{user.mobile || '-'}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map((role) => (
                              <Badge key={role.name} variant="secondary" className="text-xs">
                                {role.displayName}
                              </Badge>
                            ))}
                            {(!user.roles || user.roles.length === 0) && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={user.isActive ? 'success' : 'destructive'}>
                            {user.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                          </Badge>
                        </td>
                        <td className="p-4 text-muted-foreground text-xs">
                          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '-'}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(user)}
                            disabled={togglingId === user.id}
                            className={cn(
                              'rounded-lg text-xs gap-1.5',
                              user.isActive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            )}
                          >
                            {togglingId === user.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : user.isActive ? (
                              <ToggleRight className="h-3.5 w-3.5" />
                            ) : (
                              <ToggleLeft className="h-3.5 w-3.5" />
                            )}
                            {user.isActive ? t('users.deactivate', 'Deactivate') : t('users.activate', 'Activate')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Cards */}
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <Card key={user.id} className="shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#f26f31]/20 to-orange-100 flex items-center justify-center text-sm font-bold text-[#f26f31]">
                        {(user.firstName?.[0] || '').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant={user.isActive ? 'success' : 'destructive'} className="text-xs">
                      {user.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                    </Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {user.roles?.map((role) => (
                      <Badge key={role.name} variant="secondary" className="text-xs">
                        {role.displayName}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <div className="text-xs text-muted-foreground">
                      {user.lastLoginAt
                        ? t('users.lastLogin', 'Last login') + ': ' + formatDateTime(user.lastLoginAt)
                        : t('users.neverLoggedIn', 'Never logged in')}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(user)}
                      disabled={togglingId === user.id}
                      className={cn(
                        'rounded-lg text-xs',
                        user.isActive ? 'text-red-600' : 'text-green-600'
                      )}
                    >
                      {togglingId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : user.isActive ? (
                        t('users.deactivate', 'Deactivate')
                      ) : (
                        t('users.activate', 'Activate')
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
