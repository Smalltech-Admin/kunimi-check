// API Request/Response types

import type { Role, RecordStatus, Section } from './database';

// Auth API
export interface LoginRequest {
  userId: string;
  password?: string;
  qrCode?: string; // QRコードログイン用
}

export interface LoginResponse {
  success: boolean;
  user?: {
    user_id: string;
    name: string;
    role: Role;
  };
  message?: string;
}

export interface MeResponse {
  user_id: string;
  name: string;
  role: Role;
}

// Record API
export interface CreateRecordRequest {
  productId: string;
  lineId: string;
  productionDate: string;
}

export interface CreateRecordResponse {
  success: boolean;
  id?: string; // UUID (auto-generated)
  message?: string;
}

export interface RecordResponse {
  id: string; // UUID (PK)
  template_id: string;
  product_id: string;
  product_name: string;
  line_id: string;
  line_name: string;
  production_date: string;
  batch_number: number;
  status: RecordStatus;
  current_editor_id: string | null;
  created_by: string;
  created_by_name: string;
  created_at: string;
  submitted_by: string | null;
  submitted_at: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  reject_reason: string | null;
}

export interface DraftRecordListItem {
  id: string;
  product_name: string;
  line_name: string;
  production_date: string;
  batch_number: number;
  status: 'draft' | 'rejected';
  created_by_name: string;
  current_editor_name: string | null;
}

export interface SubmittedRecordListItem {
  id: string;
  product_name: string;
  line_name: string;
  production_date: string;
  batch_number: number;
  created_by_name: string;
  submitted_at: string;
}

export interface SearchRecordListItem {
  id: string;
  product_name: string;
  line_name: string;
  production_date: string;
  batch_number: number;
  status: RecordStatus;
  created_by_name: string;
  approved_by_name: string | null;
  created_at: string;
  approved_at: string | null;
}

// Template API
export interface TemplateResponse {
  id: string; // UUID (PK)
  product_id: string;
  version: number;
  sections: Section[];
}

// Item API
export interface SaveItemRequest {
  itemId: string;
  rowIndex: number;
  value: string;
  isValid: boolean;
}

export interface ItemValuesResponse {
  [key: string]: {
    value: string | null;
    is_valid: boolean;
    input_by: string | null;
    input_at: string;
  };
}

// Reject API
export interface RejectRequest {
  reason: string;
}

// Search API
export interface SearchParams {
  productId?: string;
  startDate?: string;
  endDate?: string;
  statuses?: RecordStatus[];
}

// Generic API Response
export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  message?: string;
}
