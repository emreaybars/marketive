// API Error Types
export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}
