import {
  mysqlTable,
  serial,
  bigint,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/mysql-core'
import { relations } from 'drizzle-orm'
import { mstUsers, mstCategories } from './index'
import { approvalWorkflows, approvalInstances } from './approval'

// ─── CATEGORY → APPROVAL WORKFLOW MAPPING ───────────────────────
export const trsCategoryApprovalWorkflows = mysqlTable('trs_category_approval_workflows', {
  id: serial('id').primaryKey(),
  categoryId: bigint('category_id', { mode: 'number', unsigned: true }).notNull().references(() => mstCategories.id),
  workflowId: bigint('workflow_id', { mode: 'number', unsigned: true }).notNull().references(() => approvalWorkflows.id),
  createdAt: timestamp('created_at').defaultNow(),
})

// ─── DOCUMENT REQUESTS ──────────────────────────────────────────
export const trsDocumentRequests = mysqlTable('trs_document_requests', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  categoryId: bigint('category_id', { mode: 'number', unsigned: true }).notNull().references(() => mstCategories.id),
  requesterId: bigint('requester_id', { mode: 'number', unsigned: true }).notNull().references(() => mstUsers.id),
  approvalInstanceId: bigint('approval_instance_id', { mode: 'number', unsigned: true }).references(() => approvalInstances.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
})

// ─── RELATIONS ──────────────────────────────────────────────────
export const trsCategoryApprovalWorkflowsRelations = relations(trsCategoryApprovalWorkflows, ({ one }) => ({
  category: one(mstCategories, { fields: [trsCategoryApprovalWorkflows.categoryId], references: [mstCategories.id] }),
  workflow: one(approvalWorkflows, { fields: [trsCategoryApprovalWorkflows.workflowId], references: [approvalWorkflows.id] }),
}))

export const trsDocumentRequestsRelations = relations(trsDocumentRequests, ({ one }) => ({
  category: one(mstCategories, { fields: [trsDocumentRequests.categoryId], references: [mstCategories.id] }),
  requester: one(mstUsers, { fields: [trsDocumentRequests.requesterId], references: [mstUsers.id] }),
  approvalInstance: one(approvalInstances, { fields: [trsDocumentRequests.approvalInstanceId], references: [approvalInstances.id] }),
}))

// ─── TYPE EXPORTS ───────────────────────────────────────────────
export type TrsCategoryApprovalWorkflow = typeof trsCategoryApprovalWorkflows.$inferSelect
export type NewTrsCategoryApprovalWorkflow = typeof trsCategoryApprovalWorkflows.$inferInsert

export type TrsDocumentRequest = typeof trsDocumentRequests.$inferSelect
export type NewTrsDocumentRequest = typeof trsDocumentRequests.$inferInsert

