export interface DocumentRequest {
  id: number
  title: string
  description: string | null
  category_id: number
  category_name: string
  requester_id: number
  requester_name: string
  status: string
  approval_instance_id: number | null
  current_step: number | null
  total_steps: number
  created_at: string
  updated_at: string
}

export interface DocumentRequestDetail extends DocumentRequest {
  approval_steps: ApprovalStepInfo[]
  audit_logs: AuditLogEntry[]
}

export interface ApprovalStepInfo {
  step: number
  approver_id: number
  approver_name: string
  status: string
  approved_at: string | null
  notes: string | null
}

export interface AuditLogEntry {
  id: number
  action: string
  comment: string | null
  step: number
  approver_name: string
  created_at: string
}

export interface InboxItem {
  document_request_id: number
  title: string
  description: string | null
  category_name: string
  requester_name: string
  current_step: number
  total_steps: number
  instance_step_id: number
  created_at: string
}

