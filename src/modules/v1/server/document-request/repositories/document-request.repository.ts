import { db, schema } from '@/src/core/db'
import { and, eq, isNull, desc, asc, count, like, or, inArray } from 'drizzle-orm'

export const DocumentRequestRepository = {
  async getAll(page = 1, perPage = 20, keywords = '', requesterId?: number) {
    const conditions = [isNull(schema.trsDocumentRequests.deletedAt)]

    if (requesterId) {
      conditions.push(eq(schema.trsDocumentRequests.requesterId, requesterId))
    }

    if (keywords) {
      conditions.push(
        or(
          like(schema.trsDocumentRequests.title, `%${keywords}%`),
          like(schema.trsDocumentRequests.description, `%${keywords}%`),
        )!
      )
    }

    const where = and(...conditions)

    const [data, countResult] = await Promise.all([
      db
        .select({
          docRequest: schema.trsDocumentRequests,
          category: schema.mstCategories,
          requester: schema.mstUsers,
          instance: schema.approvalInstances,
        })
        .from(schema.trsDocumentRequests)
        .leftJoin(schema.mstCategories, eq(schema.trsDocumentRequests.categoryId, schema.mstCategories.id))
        .leftJoin(schema.mstUsers, eq(schema.trsDocumentRequests.requesterId, schema.mstUsers.id))
        .leftJoin(schema.approvalInstances, eq(schema.trsDocumentRequests.approvalInstanceId, schema.approvalInstances.id))
        .where(where)
        .orderBy(desc(schema.trsDocumentRequests.id))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db.select({ value: count() }).from(schema.trsDocumentRequests).where(where),
    ])

    const instanceIds = data
      .map((row) => row.instance?.id)
      .filter((id): id is number => id !== null && id !== undefined)

    const stepCountMap = new Map<number, number>()
    if (instanceIds.length > 0) {
      const stepCounts = await db
        .select({
          instanceId: schema.approvalInstanceSteps.instanceId,
          value: count(),
        })
        .from(schema.approvalInstanceSteps)
        .where(inArray(schema.approvalInstanceSteps.instanceId, instanceIds))
        .groupBy(schema.approvalInstanceSteps.instanceId)

      for (const sc of stepCounts) {
        stepCountMap.set(Number(sc.instanceId), Number(sc.value))
      }
    }

    const items = data.map((row) => {
      const totalSteps = row.instance ? (stepCountMap.get(Number(row.instance.id)) ?? 0) : 0

      return {
        id: Number(row.docRequest.id),
        title: row.docRequest.title,
        description: row.docRequest.description,
        category_id: Number(row.docRequest.categoryId),
        category_name: row.category?.name ?? '',
        requester_id: Number(row.docRequest.requesterId),
        requester_name: row.requester?.name ?? '',
        status: row.docRequest.status,
        approval_instance_id: row.docRequest.approvalInstanceId ? Number(row.docRequest.approvalInstanceId) : null,
        current_step: row.instance?.currentStep ? Number(row.instance.currentStep) : null,
        total_steps: totalSteps,
        created_at: row.docRequest.createdAt ? new Date(row.docRequest.createdAt).toISOString() : '',
        updated_at: row.docRequest.updatedAt ? new Date(row.docRequest.updatedAt).toISOString() : '',
      }
    })

    const total = Number(countResult[0]?.value ?? 0)

    return {
      items,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage) || 1,
      },
    }
  },

  async getById(id: number) {
    const rows = await db
      .select({
        docRequest: schema.trsDocumentRequests,
        category: schema.mstCategories,
        requester: schema.mstUsers,
        instance: schema.approvalInstances,
      })
      .from(schema.trsDocumentRequests)
      .leftJoin(schema.mstCategories, eq(schema.trsDocumentRequests.categoryId, schema.mstCategories.id))
      .leftJoin(schema.mstUsers, eq(schema.trsDocumentRequests.requesterId, schema.mstUsers.id))
      .leftJoin(schema.approvalInstances, eq(schema.trsDocumentRequests.approvalInstanceId, schema.approvalInstances.id))
      .where(and(eq(schema.trsDocumentRequests.id, id), isNull(schema.trsDocumentRequests.deletedAt)))
      .limit(1)

    if (!rows.length) return null

    const row = rows[0]

    let approvalSteps: Array<{
      step: number
      approver_id: number
      approver_name: string
      status: string
      approved_at: string | null
      notes: string | null
    }> = []

    let auditLogs: Array<{
      id: number
      action: string
      comment: string | null
      step: number
      approver_name: string
      created_at: string
    }> = []

    if (row.instance) {
      const instanceSteps = await db
        .select({
          instanceStep: schema.approvalInstanceSteps,
          step: schema.approvalSteps,
          approver: schema.mstUsers,
        })
        .from(schema.approvalInstanceSteps)
        .innerJoin(schema.approvalSteps, eq(schema.approvalInstanceSteps.stepId, schema.approvalSteps.id))
        .innerJoin(schema.mstUsers, eq(schema.approvalInstanceSteps.approverUserId, schema.mstUsers.id))
        .where(eq(schema.approvalInstanceSteps.instanceId, row.instance.id))
        .orderBy(asc(schema.approvalSteps.step))

      approvalSteps = instanceSteps.map((s) => ({
        instance_step_id: Number(s.instanceStep.id),
        step: Number(s.step.step),
        approver_id: Number(s.instanceStep.approverUserId),
        approver_name: s.approver.name,
        status: s.instanceStep.status ?? 'pending',
        approved_at: s.instanceStep.approvedAt ? new Date(s.instanceStep.approvedAt).toISOString() : null,
        notes: s.instanceStep.notes,
      }))

      // Get audit logs
      const logs = await db
        .select({
          log: schema.approvalLogs,
          instanceStep: schema.approvalInstanceSteps,
          step: schema.approvalSteps,
          approver: schema.mstUsers,
        })
        .from(schema.approvalLogs)
        .innerJoin(schema.approvalInstanceSteps, eq(schema.approvalLogs.instanceStepId, schema.approvalInstanceSteps.id))
        .innerJoin(schema.approvalSteps, eq(schema.approvalInstanceSteps.stepId, schema.approvalSteps.id))
        .innerJoin(schema.mstUsers, eq(schema.approvalInstanceSteps.approverUserId, schema.mstUsers.id))
        .where(eq(schema.approvalInstanceSteps.instanceId, row.instance.id))
        .orderBy(desc(schema.approvalLogs.createdAt))

      auditLogs = logs.map((l) => ({
        id: Number(l.log.id),
        action: l.log.action,
        comment: l.log.comment,
        step: Number(l.step.step),
        approver_name: l.approver.name,
        created_at: l.log.createdAt ? new Date(l.log.createdAt).toISOString() : '',
      }))
    }

    const totalSteps = approvalSteps.length

    return {
      id: Number(row.docRequest.id),
      title: row.docRequest.title,
      description: row.docRequest.description,
      category_id: Number(row.docRequest.categoryId),
      category_name: row.category?.name ?? '',
      requester_id: Number(row.docRequest.requesterId),
      requester_name: row.requester?.name ?? '',
      status: row.docRequest.status,
      approval_instance_id: row.docRequest.approvalInstanceId ? Number(row.docRequest.approvalInstanceId) : null,
      current_step: row.instance?.currentStep ? Number(row.instance.currentStep) : null,
      total_steps: totalSteps,
      created_at: row.docRequest.createdAt ? new Date(row.docRequest.createdAt).toISOString() : '',
      updated_at: row.docRequest.updatedAt ? new Date(row.docRequest.updatedAt).toISOString() : '',
      approval_steps: approvalSteps,
      audit_logs: auditLogs,
    }
  },

  async create(data: { title: string; description?: string; categoryId: number; requesterId: number }) {
    const mapping = await db.query.trsCategoryApprovalWorkflows.findFirst({
      where: eq(schema.trsCategoryApprovalWorkflows.categoryId, data.categoryId),
    })

    if (!mapping) {
      throw new Error('No approval workflow configured for this category')
    }

    const workflowSteps = await db
      .select()
      .from(schema.approvalSteps)
      .where(eq(schema.approvalSteps.workflowId, mapping.workflowId))
      .orderBy(asc(schema.approvalSteps.step))

    if (workflowSteps.length === 0) {
      throw new Error('Approval workflow has no steps configured')
    }

    // Create the document request
    await db.insert(schema.trsDocumentRequests).values({
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId,
      requesterId: data.requesterId,
      status: 'pending',
    })

    const docRequest = await db.query.trsDocumentRequests.findFirst({
      orderBy: [desc(schema.trsDocumentRequests.id)],
      where: and(
        eq(schema.trsDocumentRequests.title, data.title),
        eq(schema.trsDocumentRequests.requesterId, data.requesterId),
        isNull(schema.trsDocumentRequests.deletedAt),
      ),
    })

    if (!docRequest) throw new Error('Failed to create document request')

    // Create approval instance
    await db.insert(schema.approvalInstances).values({
      workflowId: mapping.workflowId,
      modelType: 'document_request',
      modelId: String(docRequest.id),
      currentStep: 1,
      status: 'pending',
    })

    const instance = await db.query.approvalInstances.findFirst({
      orderBy: [desc(schema.approvalInstances.id)],
      where: and(
        eq(schema.approvalInstances.modelType, 'document_request'),
        eq(schema.approvalInstances.modelId, String(docRequest.id)),
      ),
    })

    if (!instance) throw new Error('Failed to create approval instance')

    // Snapshot approval steps into instance steps in a single batch insert
    const stepsToInsert = workflowSteps
      .filter((step) => !!step.userId)
      .map((step) => ({
        instanceId: instance.id,
        stepId: step.id,
        approverUserId: step.userId!,
        status: 'pending',
        employeeName: null,
        employeePosition: null,
        divisionName: null,
        signature: null,
        notes: null,
      }))

    if (stepsToInsert.length > 0) {
      await db.insert(schema.approvalInstanceSteps).values(stepsToInsert)
    }

    // Create audit log for the "create" action
    const firstInstanceStep = await db.query.approvalInstanceSteps.findFirst({
      where: eq(schema.approvalInstanceSteps.instanceId, instance.id),
      orderBy: [asc(schema.approvalInstanceSteps.id)],
    })

    if (firstInstanceStep) {
      await db.insert(schema.approvalLogs).values({
        instanceStepId: firstInstanceStep.id,
        action: 'created',
        comment: `Document request "${data.title}" submitted`,
      })
    }

    // Link approval instance to document request
    await db.update(schema.trsDocumentRequests)
      .set({ approvalInstanceId: instance.id })
      .where(eq(schema.trsDocumentRequests.id, docRequest.id))

    return { id: docRequest.id }
  },

  async getInbox(userId: number, page = 1, perPage = 20) {
    const baseConditions = and(
      eq(schema.approvalInstanceSteps.approverUserId, userId),
      eq(schema.approvalInstanceSteps.status, 'pending'),
      eq(schema.approvalInstances.status, 'pending'),
      eq(schema.approvalSteps.step, schema.approvalInstances.currentStep),
      isNull(schema.trsDocumentRequests.deletedAt),
    )

    const items = await db
      .select({
        docRequest: schema.trsDocumentRequests,
        instance: schema.approvalInstances,
        instanceStep: schema.approvalInstanceSteps,
        step: schema.approvalSteps,
        category: schema.mstCategories,
        requester: schema.mstUsers,
      })
      .from(schema.approvalInstanceSteps)
      .innerJoin(schema.approvalInstances, eq(schema.approvalInstanceSteps.instanceId, schema.approvalInstances.id))
      .innerJoin(schema.approvalSteps, eq(schema.approvalInstanceSteps.stepId, schema.approvalSteps.id))
      .innerJoin(schema.trsDocumentRequests, eq(schema.trsDocumentRequests.approvalInstanceId, schema.approvalInstances.id))
      .leftJoin(schema.mstCategories, eq(schema.trsDocumentRequests.categoryId, schema.mstCategories.id))
      .leftJoin(schema.mstUsers, eq(schema.trsDocumentRequests.requesterId, schema.mstUsers.id))
      .where(baseConditions)
      .orderBy(desc(schema.trsDocumentRequests.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage)

    const countItems = await db
      .select({ value: count() })
      .from(schema.approvalInstanceSteps)
      .innerJoin(schema.approvalInstances, eq(schema.approvalInstanceSteps.instanceId, schema.approvalInstances.id))
      .innerJoin(schema.approvalSteps, eq(schema.approvalInstanceSteps.stepId, schema.approvalSteps.id))
      .innerJoin(schema.trsDocumentRequests, eq(schema.trsDocumentRequests.approvalInstanceId, schema.approvalInstances.id))
      .where(baseConditions)

    const total = Number(countItems[0]?.value ?? 0)

    const instanceIds = items
      .map((row) => row.instance?.id)
      .filter((id): id is number => id !== null && id !== undefined)

    const stepCountMap = new Map<number, number>()
    if (instanceIds.length > 0) {
      const stepCounts = await db
        .select({
          instanceId: schema.approvalInstanceSteps.instanceId,
          value: count(),
        })
        .from(schema.approvalInstanceSteps)
        .where(inArray(schema.approvalInstanceSteps.instanceId, instanceIds))
        .groupBy(schema.approvalInstanceSteps.instanceId)

      for (const sc of stepCounts) {
        stepCountMap.set(Number(sc.instanceId), Number(sc.value))
      }
    }

    const mappedItems = items.map((row) => {
      const totalSteps = row.instance ? (stepCountMap.get(Number(row.instance.id)) ?? 0) : 0

      return {
        document_request_id: Number(row.docRequest.id),
        title: row.docRequest.title,
        description: row.docRequest.description,
        category_name: row.category?.name ?? '',
        requester_name: row.requester?.name ?? '',
        current_step: Number(row.instance.currentStep ?? 1),
        total_steps: totalSteps,
        instance_step_id: Number(row.instanceStep.id),
        created_at: row.docRequest.createdAt ? new Date(row.docRequest.createdAt).toISOString() : '',
      }
    })

    return {
      items: mappedItems,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage) || 1,
      },
    }
  },

  async processApproval(instanceStepId: number, userId: number, action: 'approve' | 'reject', comment?: string) {
    // 1. Get the instance step with its relations
    const instanceStepRows = await db
      .select({
        instanceStep: schema.approvalInstanceSteps,
        instance: schema.approvalInstances,
        step: schema.approvalSteps,
      })
      .from(schema.approvalInstanceSteps)
      .innerJoin(schema.approvalInstances, eq(schema.approvalInstanceSteps.instanceId, schema.approvalInstances.id))
      .innerJoin(schema.approvalSteps, eq(schema.approvalInstanceSteps.stepId, schema.approvalSteps.id))
      .where(eq(schema.approvalInstanceSteps.id, instanceStepId))
      .limit(1)

    if (!instanceStepRows.length) throw new Error('Approval step not found')

    const { instanceStep, instance, step } = instanceStepRows[0]

    // Guard: Only the assigned approver can act
    if (Number(instanceStep.approverUserId) !== userId) {
      throw new Error('You are not the approver for this step')
    }

    // Guard: Step must be pending
    if (instanceStep.status !== 'pending') {
      throw new Error('This step has already been processed')
    }

    // Guard: Instance must be pending
    if (instance.status !== 'pending') {
      throw new Error('This request has already been finalized')
    }

    // Guard: Must be the current active step
    if (Number(step.step) !== Number(instance.currentStep)) {
      throw new Error('This is not the current active step')
    }

    // Guard: Self-approval check
    const docRequestRows = await db
      .select()
      .from(schema.trsDocumentRequests)
      .where(and(
        eq(schema.trsDocumentRequests.approvalInstanceId, instance.id),
        isNull(schema.trsDocumentRequests.deletedAt),
      ))
      .limit(1)

    if (!docRequestRows.length) throw new Error('Document request not found')

    const docRequest = docRequestRows[0]

    if (Number(docRequest.requesterId) === userId) {
      throw new Error('You cannot approve/reject your own request')
    }

    // Reject requires comment
    if (action === 'reject' && !comment?.trim()) {
      throw new Error('Comment is required for rejection')
    }

    // Update the instance step
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    await db.update(schema.approvalInstanceSteps).set({
      status: newStatus,
      approvedAt: new Date(),
      notes: comment || null,
    }).where(and(
      eq(schema.approvalInstanceSteps.id, instanceStepId),
      eq(schema.approvalInstanceSteps.status, 'pending'),
    ))

    // Verify the update happened (race condition guard)
    const updatedStep = await db.query.approvalInstanceSteps.findFirst({
      where: eq(schema.approvalInstanceSteps.id, instanceStepId),
    })

    if (updatedStep?.status !== newStatus) {
      throw new Error('Failed to update - step may have been processed by another user')
    }

    // Create audit log
    await db.insert(schema.approvalLogs).values({
      instanceStepId,
      action: newStatus,
      comment: comment || null,
    })

    // Handle flow
    if (action === 'reject') {
      await db.update(schema.approvalInstances).set({
        status: 'rejected',
      }).where(eq(schema.approvalInstances.id, instance.id))

      await db.update(schema.trsDocumentRequests).set({
        status: 'rejected',
      }).where(eq(schema.trsDocumentRequests.id, docRequest.id))
    } else {
      const allSteps = await db
        .select({ instanceStep: schema.approvalInstanceSteps, step: schema.approvalSteps })
        .from(schema.approvalInstanceSteps)
        .innerJoin(schema.approvalSteps, eq(schema.approvalInstanceSteps.stepId, schema.approvalSteps.id))
        .where(eq(schema.approvalInstanceSteps.instanceId, instance.id))
        .orderBy(asc(schema.approvalSteps.step))

      const currentStepIndex = allSteps.findIndex(
        (s) => Number(s.step.step) === Number(instance.currentStep)
      )
      const nextStep = allSteps[currentStepIndex + 1]

      if (nextStep) {
        await db.update(schema.approvalInstances).set({
          currentStep: Number(nextStep.step.step),
        }).where(eq(schema.approvalInstances.id, instance.id))
      } else {
        await db.update(schema.approvalInstances).set({
          status: 'approved',
        }).where(eq(schema.approvalInstances.id, instance.id))

        await db.update(schema.trsDocumentRequests).set({
          status: 'approved',
        }).where(eq(schema.trsDocumentRequests.id, docRequest.id))
      }
    }

    return { success: true }
  },

  async getCategories() {
    return db
      .select({
        id: schema.mstCategories.id,
        code: schema.mstCategories.code,
        name: schema.mstCategories.name,
      })
      .from(schema.mstCategories)
      .innerJoin(schema.trsCategoryApprovalWorkflows, eq(schema.mstCategories.id, schema.trsCategoryApprovalWorkflows.categoryId))
      .where(and(
        eq(schema.mstCategories.isActive, true),
        isNull(schema.mstCategories.deletedAt),
      ))
      .orderBy(asc(schema.mstCategories.name))
  },
}

