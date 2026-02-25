export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  timestamp?: number
}

export class ResponseWrapper {
  static success<T>(data?: T, message: string = '操作成功'): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      timestamp: Date.now(),
    }
  }

  static error(message: string = '操作失败'): ApiResponse {
    return {
      success: false,
      message,
      timestamp: Date.now(),
    }
  }
}
