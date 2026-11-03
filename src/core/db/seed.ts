import 'dotenv/config'
import { db, schema } from './index'
import { hashPassword } from '@/src/core/auth/password'

async function main() {
  console.log('Seeding database...')

  // ─── PERMISSIONS ────────────────────────────────────────
  await db.insert(schema.mstPermissions).values([
    { name: 'master-data.view', guardName: 'web' },
    { name: 'master-data.manage', guardName: 'web' },
    { name: 'user.view', guardName: 'web' },
    { name: 'user.manage', guardName: 'web' },
    { name: 'role.view', guardName: 'web' },
    { name: 'role.manage', guardName: 'web' },
    { name: 'permission.view', guardName: 'web' },
    { name: 'configuration.approval-line.view', guardName: 'web' },
    { name: 'configuration.approval-line.manage', guardName: 'web' },
    { name: 'document-request.view', guardName: 'web' },
    { name: 'document-request.manage', guardName: 'web' },
    { name: 'approval.review', guardName: 'web' },
  ])
  const permissions = await db.query.mstPermissions.findMany()
  console.log(`  ${permissions.length} permissions created`)

  const permMap = Object.fromEntries(permissions.map(p => [p.name, p.id]))

  // ─── ROLES ──────────────────────────────────────────────
  await db.insert(schema.mstRoles).values([
    { name: 'super-admin', guardName: 'web', isSystem: true },
    { name: 'admin', guardName: 'web', isSystem: true },
    { name: 'viewer', guardName: 'web', isSystem: true },
    { name: 'approver', guardName: 'web', isSystem: false },
  ])
  console.log('  4 roles created')

  const allRoles = await db.query.mstRoles.findMany()
  const roleMap = Object.fromEntries(allRoles.map(r => [r.name, r.id]))

  // ─── ROLE PERMISSIONS ───────────────────────────────────
  const rolePermValues = [
    // super-admin: all permissions
    ...permissions.map(p => ({ roleId: roleMap['super-admin'], permissionId: p.id })),
    // admin: manage master-data + user + role + configuration + document-request + approval
    { roleId: roleMap['admin'], permissionId: permMap['master-data.view'] },
    { roleId: roleMap['admin'], permissionId: permMap['master-data.manage'] },
    { roleId: roleMap['admin'], permissionId: permMap['user.view'] },
    { roleId: roleMap['admin'], permissionId: permMap['user.manage'] },
    { roleId: roleMap['admin'], permissionId: permMap['role.view'] },
    { roleId: roleMap['admin'], permissionId: permMap['role.manage'] },
    { roleId: roleMap['admin'], permissionId: permMap['permission.view'] },
    { roleId: roleMap['admin'], permissionId: permMap['configuration.approval-line.view'] },
    { roleId: roleMap['admin'], permissionId: permMap['configuration.approval-line.manage'] },
    { roleId: roleMap['admin'], permissionId: permMap['document-request.view'] },
    { roleId: roleMap['admin'], permissionId: permMap['document-request.manage'] },
    { roleId: roleMap['admin'], permissionId: permMap['approval.review'] },
    // viewer: view only
    { roleId: roleMap['viewer'], permissionId: permMap['master-data.view'] },
    { roleId: roleMap['viewer'], permissionId: permMap['user.view'] },
    { roleId: roleMap['viewer'], permissionId: permMap['role.view'] },
    { roleId: roleMap['viewer'], permissionId: permMap['permission.view'] },
    { roleId: roleMap['viewer'], permissionId: permMap['configuration.approval-line.view'] },
    { roleId: roleMap['viewer'], permissionId: permMap['document-request.view'] },
    // approver: can view document requests + review approvals
    { roleId: roleMap['approver'], permissionId: permMap['document-request.view'] },
    { roleId: roleMap['approver'], permissionId: permMap['approval.review'] },
  ]
  await db.insert(schema.trsRolePermissions).values(rolePermValues)
  console.log(`  ${rolePermValues.length} role permissions assigned`)

  // ─── USERS ──────────────────────────────────────────────
  const adminHash = await hashPassword('admin123')
  const viewerHash = await hashPassword('viewer123')
  const approverHash = await hashPassword('approver123')

  await db.insert(schema.mstUsers).values([
    { username: 'admin', email: 'admin@skeleton.local', name: 'Super Admin', passwordHash: adminHash, isActive: true },
    { username: 'viewer', email: 'viewer@skeleton.local', name: 'Viewer User', passwordHash: viewerHash, isActive: true },
    { username: 'approver1', email: 'approver1@skeleton.local', name: 'Approver One', passwordHash: approverHash, isActive: true },
    { username: 'approver2', email: 'approver2@skeleton.local', name: 'Approver Two', passwordHash: approverHash, isActive: true },
    { username: 'approver3', email: 'approver3@skeleton.local', name: 'Approver Three', passwordHash: approverHash, isActive: true },
  ])
  const users = await db.query.mstUsers.findMany()
  const userMap = Object.fromEntries(users.map(u => [u.username, u.id]))
  console.log(`  ${users.length} users created`)

  // ─── USER ROLES ─────────────────────────────────────────
  await db.insert(schema.trsUserRoles).values([
    { userId: userMap['admin'], roleId: roleMap['super-admin'] },
    { userId: userMap['viewer'], roleId: roleMap['viewer'] },
    { userId: userMap['approver1'], roleId: roleMap['approver'] },
    { userId: userMap['approver2'], roleId: roleMap['approver'] },
    { userId: userMap['approver3'], roleId: roleMap['approver'] },
  ])
  console.log('  User roles assigned')

  // ─── CATEGORIES (sample) ────────────────────────────────
  await db.insert(schema.mstCategories).values([
    { code: 'SDM', name: 'Sumber Daya Manusia', description: 'Kategori untuk dokumen terkait SDM', isActive: true },
    { code: 'IT', name: 'Teknologi Informasi', description: 'Kategori untuk dokumen terkait IT', isActive: true },
    { code: 'FIN', name: 'Keuangan', description: 'Kategori untuk dokumen terkait keuangan', isActive: true },
  ])
  const categories = await db.query.mstCategories.findMany()
  const catMap = Object.fromEntries(categories.map(c => [c.code, c.id]))
  console.log('  3 sample categories created')

  // ─── FEATURES ───────────────────────────────────────────
  await db.insert(schema.mstFeatures).values([
    { code: 'DASHBOARD', name: 'Dashboard', routePath: '/dashboard', icon: 'LayoutDashboard', sortOrder: 0, parentId: null },
  ])
  const dashboardFeature = await db.query.mstFeatures.findFirst({
    where: (f, { eq }) => eq(f.code, 'DASHBOARD'),
  })

  await db.insert(schema.mstFeatures).values([
    { code: 'CATEGORY', name: 'Category', routePath: '/dashboard/master-data/category', icon: 'FolderTree', sortOrder: 1, parentId: dashboardFeature!.id },
    { code: 'USER', name: 'Users', routePath: '/dashboard/user-management/user', icon: 'Users', sortOrder: 2, parentId: dashboardFeature!.id },
    { code: 'ROLE', name: 'Roles', routePath: '/dashboard/user-management/role', icon: 'Shield', sortOrder: 3, parentId: dashboardFeature!.id },
    { code: 'PERMISSION', name: 'Permissions', routePath: '/dashboard/user-management/permission', icon: 'KeyRound', sortOrder: 4, parentId: dashboardFeature!.id },
    { code: 'APPROVAL_LINE', name: 'Approval Lines', routePath: '/dashboard/configuration/approval-line', icon: 'GitBranch', sortOrder: 5, parentId: dashboardFeature!.id },
    { code: 'DOCUMENT_REQUEST', name: 'Document Request', routePath: '/dashboard/document-request', icon: 'FileText', sortOrder: 6, parentId: dashboardFeature!.id },
    { code: 'APPROVAL_INBOX', name: 'Approval Inbox', routePath: '/dashboard/approval-inbox', icon: 'Inbox', sortOrder: 7, parentId: dashboardFeature!.id },
  ])
  const features = await db.query.mstFeatures.findMany({
    where: (f, { ne }) => ne(f.code, 'DASHBOARD'),
  })
  console.log(`  ${features.length + 1} features created`)

  // ─── DOCUMENT REQUEST FEATURE ID ────────────────────────
  const docReqFeature = await db.query.mstFeatures.findFirst({
    where: (f, { eq }) => eq(f.code, 'DOCUMENT_REQUEST'),
  })

  // ─── SAMPLE APPROVAL WORKFLOW (original) ────────────────
  await db.insert(schema.approvalWorkflows).values([
    { featureId: features[0].id, name: 'Category Approval', isActive: true },
  ])
  const catWorkflow = await db.query.approvalWorkflows.findFirst({
    where: (w, { eq }) => eq(w.name, 'Category Approval'),
  })

  await db.insert(schema.approvalSteps).values([
    { workflowId: catWorkflow!.id, step: 1, groupNo: 1, approverType: 'user', userId: userMap['admin'], groupType: 'SEQUENTIAL', minApproval: 1, isRequired: true, allowedActions: 'approve,reject' },
  ])
  console.log('  1 sample approval workflow created (Category)')

  // ─── DOCUMENT REQUEST APPROVAL WORKFLOWS ────────────────
  // SDM: 3-step approval (approver1 → approver2 → approver3)
  await db.insert(schema.approvalWorkflows).values([
    { featureId: docReqFeature!.id, name: 'SDM Document Approval (3-step)', isActive: true },
  ])
  const sdmWorkflow = await db.query.approvalWorkflows.findFirst({
    where: (w, { eq }) => eq(w.name, 'SDM Document Approval (3-step)'),
  })

  await db.insert(schema.approvalSteps).values([
    { workflowId: sdmWorkflow!.id, step: 1, groupNo: 1, approverType: 'user', userId: userMap['approver1'], groupType: 'SEQUENTIAL', minApproval: 1, isRequired: true, allowedActions: 'approve,reject' },
    { workflowId: sdmWorkflow!.id, step: 2, groupNo: 1, approverType: 'user', userId: userMap['approver2'], groupType: 'SEQUENTIAL', minApproval: 1, isRequired: true, allowedActions: 'approve,reject' },
    { workflowId: sdmWorkflow!.id, step: 3, groupNo: 1, approverType: 'user', userId: userMap['approver3'], groupType: 'SEQUENTIAL', minApproval: 1, isRequired: true, allowedActions: 'approve,reject' },
  ])
  console.log('  SDM workflow created: 3 sequential steps (approver1 → approver2 → approver3)')

  // IT: 2-step approval (approver1 → approver2)
  await db.insert(schema.approvalWorkflows).values([
    { featureId: docReqFeature!.id, name: 'IT Document Approval (2-step)', isActive: true },
  ])
  const itWorkflow = await db.query.approvalWorkflows.findFirst({
    where: (w, { eq }) => eq(w.name, 'IT Document Approval (2-step)'),
  })

  await db.insert(schema.approvalSteps).values([
    { workflowId: itWorkflow!.id, step: 1, groupNo: 1, approverType: 'user', userId: userMap['approver1'], groupType: 'SEQUENTIAL', minApproval: 1, isRequired: true, allowedActions: 'approve,reject' },
    { workflowId: itWorkflow!.id, step: 2, groupNo: 1, approverType: 'user', userId: userMap['approver2'], groupType: 'SEQUENTIAL', minApproval: 1, isRequired: true, allowedActions: 'approve,reject' },
  ])
  console.log('  IT workflow created: 2 sequential steps (approver1 → approver2)')

  // ─── CATEGORY → APPROVAL WORKFLOW MAPPING ──────────────
  await db.insert(schema.trsCategoryApprovalWorkflows).values([
    { categoryId: catMap['SDM']!, workflowId: sdmWorkflow!.id },
    { categoryId: catMap['IT']!, workflowId: itWorkflow!.id },
  ])
  console.log('  Category → workflow mappings created (SDM → 3-step, IT → 2-step)')

  console.log('\nSeed completed!')
  console.log('  Login: admin / admin123     (super-admin: can submit requests)')
  console.log('  Login: viewer / viewer123   (viewer: can only view)')
  console.log('  Login: approver1 / approver123 (approver: step 1 on both workflows)')
  console.log('  Login: approver2 / approver123 (approver: step 2 on both workflows)')
  console.log('  Login: approver3 / approver123 (approver: step 3 on SDM workflow)')
}

main().catch(console.error)
