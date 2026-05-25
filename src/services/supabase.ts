import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface AppUser {
  id: string
  username: string
  password: string
  role: string
  sigla: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  parent_id: string | null
  title: string
  description: string | null
  status: 'criado' | 'fazendo' | 'pronto' | 'impedido'
  priority: 'low' | 'medium' | 'high'
  position_x: number
  position_y: number
  due_date: string | null
  responsavel_1_id: string | null
  responsavel_2_id: string | null
  data_inicio: string | null
  data_fim_prevista: string | null
  data_finalizacao: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  task_id: string
  content: string
  user_id: string
  created_at: string
}

export interface Connection {
  id: string
  project_id: string
  from_task_id: string
  to_task_id: string
  created_at: string
}

export interface TaskImage {
  id: string
  task_id: string
  url: string
  created_at: string
}

export interface AppDocument {
  id: string
  name: string
  file_url: string
  file_type: string
  version: number
  uploaded_by: string
  project_id: string | null
  created_at: string
  updated_at: string
}

export interface DocumentVersion {
  id: string
  document_id: string
  file_url: string
  version: number
  uploaded_by: string
  created_at: string
}

export const USER_TABLE = 'users'
export const PROJECT_TABLE = 'projects'
export const TASK_TABLE = 'tasks'
export const COMMENT_TABLE = 'comments'
export const CONNECTION_TABLE = 'connections'
export const IMAGE_TABLE = 'task_images'
export const DOCUMENT_TABLE = 'documents'
export const DOCUMENT_VERSION_TABLE = 'document_versions'