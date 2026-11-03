import { auth } from '@/src/core/auth/auth'
import { redirect } from 'next/navigation'
import { db, schema } from '@/src/core/db'
import { count, eq, isNull, asc } from 'drizzle-orm'
import Link from 'next/link'
import {
  Users,
  UserCheck,
  Shield,
  KeyRound,
  FolderTree,
  FolderSync,
  ArrowUpRight,
  CheckCircle2,
  Sliders,
  CheckSquare,
  Eye,
} from 'lucide-react'

const { mstUsers, mstRoles, mstPermissions, mstCategories } = schema

function getCategoryInitials(name: string, code?: string | null) {
  if (code === 'SDM') return 'HR'
  if (code === 'IT') return 'IT'
  if (code === 'FIN') return 'FN'
  if (code && code.length >= 2) return code.slice(0, 2).toUpperCase()
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function getRoleMeta(roleName: string, permsCount: number) {
  switch (roleName.toLowerCase()) {
    case 'super-admin':
      return {
        icon: KeyRound,
        desc: `Full privileges • ${permsCount} permissions`,
        iconBg: 'bg-primary text-on-primary',
      }
    case 'admin':
      return {
        icon: Sliders,
        desc: `Module ops • ${permsCount} permissions`,
        iconBg: 'bg-surface-container-low text-on-surface',
      }
    case 'approver':
      return {
        icon: CheckSquare,
        desc: `Approval flow • ${permsCount} permissions`,
        iconBg: 'bg-surface-container-low text-on-surface',
      }
    case 'viewer':
    default:
      return {
        icon: Eye,
        desc: `Read only • ${permsCount} permissions`,
        iconBg: 'bg-surface-container-low text-on-surface',
      }
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const [
    [{ total: totalUsers }],
    [{ total: activeUsers }],
    [{ total: totalRoles }],
    [{ total: totalPermissions }],
    [{ total: totalCategories }],
    categories,
    rolesData,
  ] = await Promise.all([
    db.select({ total: count() }).from(mstUsers).where(isNull(mstUsers.deletedAt)),
    db.select({ total: count() }).from(mstUsers).where(eq(mstUsers.isActive, true)),
    db.select({ total: count() }).from(mstRoles),
    db.select({ total: count() }).from(mstPermissions),
    db.select({ total: count() }).from(mstCategories),
    db.query.mstCategories.findMany({
      where: isNull(mstCategories.deletedAt),
      orderBy: [asc(mstCategories.id)],
    }),
    db.query.mstRoles.findMany({
      with: {
        rolePermissions: true,
      },
      orderBy: [asc(mstRoles.id)],
    }),
  ])

  return (
    <div className="flex flex-col w-full pb-10 space-y-space-xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div className="flex flex-col space-y-1">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
            Workspace Overview
          </span>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Welcome back, {session.user.name}
          </h1>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-space-md">
        {/* Metric 1: Total Users */}
        <Link
          href="/dashboard/user-management/user"
          className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm hover:shadow transition-shadow flex flex-col justify-between group border border-outline-variant/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-medium">
              Total Users
            </span>
            <Users className="w-4 h-4 text-outline group-hover:text-on-surface transition-colors" />
          </div>
          <div className="flex items-baseline justify-between mt-1 mb-2">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              {totalUsers}
            </span>
            <div className="w-16 h-6 shrink-0 text-secondary">
              <svg className="w-full h-full stroke-current fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 64 24">
                <polyline points="0,18 12,16 24,12 36,15 48,6 64,8" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono-data text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="font-semibold">+12.4%</span>
            <span className="text-secondary ml-0.5">vs last month</span>
          </div>
        </Link>

        {/* Metric 2: Active Users */}
        <Link
          href="/dashboard/user-management/user"
          className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm hover:shadow transition-shadow flex flex-col justify-between group border border-outline-variant/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-medium">
              Active Users
            </span>
            <UserCheck className="w-4 h-4 text-outline group-hover:text-on-surface transition-colors" />
          </div>
          <div className="flex items-baseline justify-between mt-1 mb-2">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              {activeUsers}
            </span>
            <div className="w-16 h-6 shrink-0 text-secondary">
              <svg className="w-full h-full stroke-current fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 64 24">
                <polyline points="0,20 16,14 30,12 44,10 56,4 64,2" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono-data text-emerald-600">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-semibold">100%</span>
            <span className="text-secondary ml-0.5">active rate</span>
          </div>
        </Link>

        {/* Metric 3: Roles */}
        <Link
          href="/dashboard/user-management/role"
          className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm hover:shadow transition-shadow flex flex-col justify-between group border border-outline-variant/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-medium">
              Defined Roles
            </span>
            <Shield className="w-4 h-4 text-outline group-hover:text-on-surface transition-colors" />
          </div>
          <div className="flex items-baseline justify-between mt-1 mb-2">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              {totalRoles}
            </span>
            <div className="w-16 h-6 shrink-0 text-secondary">
              <svg className="w-full h-full stroke-current fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 64 24">
                <polyline points="0,15 15,15 30,8 45,12 55,5 64,6" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono-data text-secondary">
            <span className="font-medium">System &amp; Custom</span>
          </div>
        </Link>

        {/* Metric 4: Permissions */}
        <Link
          href="/dashboard/user-management/permission"
          className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm hover:shadow transition-shadow flex flex-col justify-between group border border-outline-variant/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-medium">
              Permissions
            </span>
            <KeyRound className="w-4 h-4 text-outline group-hover:text-on-surface transition-colors" />
          </div>
          <div className="flex items-baseline justify-between mt-1 mb-2">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              {totalPermissions}
            </span>
            <div className="w-16 h-6 shrink-0 text-secondary">
              <svg className="w-full h-full stroke-current fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 64 24">
                <polyline points="0,18 14,14 28,15 42,9 56,11 64,5" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono-data text-on-surface">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium text-secondary">All mapped</span>
          </div>
        </Link>

        {/* Metric 5: Master Categories */}
        <Link
          href="/dashboard/master-data/category"
          className="bg-surface-container-lowest rounded-lg p-space-md shadow-sm hover:shadow transition-shadow flex flex-col justify-between group border border-outline-variant/20"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-medium">
              Categories
            </span>
            <FolderTree className="w-4 h-4 text-outline group-hover:text-on-surface transition-colors" />
          </div>
          <div className="flex items-baseline justify-between mt-1 mb-2">
            <span className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight">
              {totalCategories}
            </span>
            <div className="w-16 h-6 shrink-0 text-secondary">
              <svg className="w-full h-full stroke-current fill-none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 64 24">
                <polyline points="0,16 12,18 28,10 40,14 54,6 64,7" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono-data text-secondary">
            <span className="font-medium">Master data synced</span>
          </div>
        </Link>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col gap-space-lg w-full">
        {/* Master Categories Registry Card */}
        <div className="w-full flex flex-col bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
          {/* Header */}
          <div className="p-space-md flex items-center justify-between border-b border-outline-variant/30">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <FolderSync className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface leading-tight">
                  Master Categories Registry
                </h2>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="h-9 bg-surface-container-low/60 text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="px-space-md py-2 font-medium">Category Name</th>
                  <th className="px-space-md py-2 font-medium">Code</th>
                  <th className="px-space-md py-2 font-medium">Description</th>
                  <th className="px-space-md py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10 font-body-md text-body-md text-on-surface">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-secondary text-sm">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  categories.map((cat, idx) => {
                    const initials = getCategoryInitials(cat.name, cat.code)
                    return (
                      <tr key={cat.id} className="h-12 hover:bg-surface-container-low/40 transition-colors group">
                        <td className="px-space-md font-semibold text-on-surface">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-7 h-7 rounded bg-secondary-container flex items-center justify-center text-on-secondary-container font-mono-data text-[11px] font-bold shrink-0">
                              {initials}
                            </div>
                            <div>
                              <span className="font-headline-sm text-headline-sm text-on-surface">{cat.name}</span>
                              <span className="block font-mono-data text-[10px] text-secondary font-normal">
                                CAT-00{cat.id || idx + 1}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-space-md">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-mono-data text-[11px] font-semibold bg-secondary-container text-on-secondary-container tracking-wider">
                            {cat.code || '-'}
                          </span>
                        </td>
                        <td className="px-space-md text-secondary max-w-xs truncate">
                          {cat.description || 'No description provided'}
                        </td>
                        <td className="px-space-md">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-sm font-label-sm font-medium ${
                            cat.isActive
                              ? 'bg-[#ecfdf5] text-[#059669]'
                              : 'bg-surface-container-low text-secondary'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-[#059669]' : 'bg-outline'}`} />
                            {cat.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-space-sm px-space-md bg-surface-container-low/40 border-t border-outline-variant/30 flex flex-wrap items-center justify-between text-secondary font-label-sm text-label-sm">
            <div className="flex items-center gap-2">
              <span>Showing {categories.length} of {totalCategories} master categories</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="h-6 px-2 rounded bg-surface-container-lowest border border-outline-variant/40 text-secondary disabled:opacity-40 font-mono-data text-xs"
              >
                Previous
              </button>
              <span className="px-2 font-mono-data text-xs text-on-surface font-semibold">1</span>
              <button
                type="button"
                disabled
                className="h-6 px-2 rounded bg-surface-container-lowest border border-outline-variant/40 text-secondary disabled:opacity-40 font-mono-data text-xs"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* System Roles Card */}
        <div className="w-full bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-space-md flex flex-col">
          <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/30 mb-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-7 h-7 rounded bg-surface-container-low flex items-center justify-center text-on-surface-variant">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">System Roles</h2>
              </div>
            </div>
            <span className="font-mono-data text-mono-data text-secondary font-medium">
              {rolesData.length} active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-sm">
            {rolesData.map((role) => {
              const permsCount = role.rolePermissions?.length ?? 0
              const meta = getRoleMeta(role.name, permsCount)
              const Icon = meta.icon

              return (
                <div
                  key={role.id}
                  className="p-space-sm rounded border border-outline-variant/30 bg-surface-container-low/30 hover:bg-surface-container-low/60 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-space-sm min-w-0">
                    <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${meta.iconBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-label-md text-label-md font-semibold text-on-surface truncate">
                          {role.name}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-secondary block truncate">
                        {meta.desc}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label-sm font-medium shrink-0 ${
                    role.isActive
                      ? 'bg-[#ecfdf5] text-[#059669]'
                      : 'bg-surface-container-low text-secondary'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${role.isActive ? 'bg-[#059669]' : 'bg-outline'}`} />
                    Active
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
