import axiosClient from './axiosClient'

export const policyService = {
  // 1. Tìm kiếm chính sách (Tìm kiếm chính sách VPS và chính sách ngoại lệ)
  search: async (params) => {
    const queryParams = {
      operatorCode: params?.operatorCode || '',
      activeStatus: params?.activeStatus !== undefined ? params.activeStatus : '',
      approveStatus: params?.approveStatus !== undefined ? params.approveStatus : '',
      fromDate: params?.fromDate || '2026-01-01',
      toDate: params?.toDate || '2026-12-31',
      page: params?.page || 0,
      size: params?.size || 100,
      exception: params?.exception !== undefined ? params.exception : 0, // 0: VPS, 1: Exception
      accountCode: params?.accountCode || params?.accountId || '',
      accountId: params?.accountId || params?.accountCode || '',
      accountName: params?.accountName || ''
    }
    
    const response = await axiosClient.get('/policy/search', { params: queryParams })
    
    if (response && (response.rc === '1' || response.rc === 1)) {
      return response.data || {}
    }
    throw new Error(response?.rs || 'Lỗi tìm kiếm chính sách')
  },

  // 2. Tạo chính sách mới (Tạo policy tạo ticket phê duyệt)
  create: async (policyData) => {
    const response = await axiosClient.post('/policy/create', policyData)
    if (response && (response.rc === '1' || response.rc === 1)) {
      return response
    }
    throw new Error(response?.rs || 'Lỗi tạo chính sách')
  },

  // 3. Phê duyệt chính sách
  approve: async ({ ticketId, isApproved }) => {
    const response = await axiosClient.post('/policy/approval', { ticketId, isApproved })
    if (response && (response.rc === '1' || response.rc === 1)) {
      return response
    }
    throw new Error(response?.rs || 'Lỗi phê duyệt chính sách')
  },

  // 4. Lấy danh sách chính sách hiệu lực hiện tại của KH
  getActivePolicy: async (params) => {
    const queryParams = {
      operatorCode: params?.operatorCode || '',
      accountCode: params?.accountCode || ''
    }
    const response = await axiosClient.get('/policy/get-active-policy', { params: queryParams })
    if (response && (response.rc === '1' || response.rc === 1)) {
      return response.data || []
    }
    throw new Error(response?.rs || 'Lỗi lấy danh sách chính sách hiệu lực')
  }
}
