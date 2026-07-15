import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSearch, 
  faPlus,
  faPen, 
  faChevronLeft,
  faChevronRight,
  faTimes,
  faEraser,
  faCalendarDays
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import * as yup from 'yup'
import Select from 'react-select'
import DatePicker, { registerLocale } from 'react-datepicker'
import { vi } from 'date-fns/locale/vi'
import 'react-datepicker/dist/react-datepicker.css'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import DataTable from '../../components/DataTable/DataTable'
import SearchableSelect from '../../components/SearchableSelect/SearchableSelect'
import { policyService } from '../../api/policyService'
import { operatorService } from '../../api/operatorService'
import styles from './VpsPolicy.module.scss'

// Đăng ký tiếng Việt cho Datepicker
registerLocale('vi', vi)


// Schema validation using Yup matching Swagger specifications
const policySchema = yup.object().shape({
  operatorCode: yup.string().trim().required('Mã nghiệp vụ không được để trống'),
  otpStatus: yup.number().required(),
  otpCondition: yup.number()
    .typeError('Điều kiện OTP phải là một số')
    .min(0, 'Điều kiện OTP phải lớn hơn hoặc bằng 0')
    .required('Điều kiện OTP không được để trống'),
  bioStatus: yup.number().required(),
  bioCondition: yup.number()
    .typeError('Điều kiện BIO phải là một số')
    .min(0, 'Điều kiện BIO phải lớn hơn hoặc bằng 0')
    .required('Điều kiện BIO không được để trống')
})

const customSelectStyles = {
  container: (provided) => ({
    ...provided,
    width: '100%'
  }),
  control: (provided, state) => ({
    ...provided,
    minHeight: '34px',
    height: '34px',
    borderRadius: '8px',
    borderColor: state.isFocused ? '#8229e3' : 'var(--input-border)',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(130, 41, 227, 0.1)' : 'none',
    fontSize: '13px',
    fontFamily: 'inherit',
    width: '100%',
    backgroundColor: 'var(--input-bg)',
    '&:hover': {
      borderColor: state.isFocused ? '#8229e3' : 'var(--input-border)'
    }
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: '0 8px',
    height: '32px',
    display: 'flex',
    alignItems: 'center'
  }),
  input: (provided) => ({
    ...provided,
    margin: '0px',
    padding: '0px',
    color: 'var(--text-primary)'
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: '32px'
  }),
  placeholder: (provided) => ({
    ...provided,
    color: '#94a3b8',
    fontSize: '13px'
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: '13px',
    color: state.isSelected ? '#ffffff' : 'var(--text-primary)',
    backgroundColor: state.isSelected ? '#8229e3' : state.isFocused ? 'var(--table-row-hover)' : 'var(--input-bg)',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#8229e3'
    }
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: '8px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--input-bg)',
    zIndex: 100
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--text-primary)',
    maxWidth: 'calc(100% - 40px)'
  })
}

export default function VpsPolicy() {
  const queryClient = useQueryClient()

  // 1. Fetch operators list for dropdown mapping
  const { data: operators = [] } = useQuery({
    queryKey: ['operators'],
    queryFn: operatorService.getList,
    staleTime: 30000
  })

  // 2. Filter states for UI Search
  const [filterOperator, setFilterOperator] = useState(null)
  const [filterApproveStatus, setFilterApproveStatus] = useState(null)
  const [filterActiveStatus, setFilterActiveStatus] = useState(null)
  const [tempFromDate, setTempFromDate] = useState(() => new Date('2026-01-01'))
  const [tempToDate, setTempToDate] = useState(() => new Date('2026-12-31'))

  const [searchParams, setSearchParams] = useState({
    operatorCode: '',
    approveStatus: '',
    activeStatus: '',
    fromDate: '2026-01-01',
    toDate: '2026-12-31'
  })

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [isPaginationEnabled] = useState(true)

  // Helper format Date sang yyyy-MM-dd
  const formatDateToYMD = (date) => {
    if (!date) return ''
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Helper format Date Time sang dd/MM/yyyy HH:mm:ss
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return dateStr
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
    } catch {
      return dateStr
    }
  }

  // 3. React Query: Fetch VPS policies list với phân trang phía server
  const { data: searchResult = { content: [], totalElements: 0, totalPages: 0 }, isLoading: isSearchLoading, isError, error } = useQuery({
    queryKey: ['vps-policies', searchParams, currentPage, itemsPerPage],
    queryFn: () => policyService.search({
      operatorCode: searchParams.operatorCode,
      approveStatus: searchParams.approveStatus,
      activeStatus: searchParams.activeStatus,
      fromDate: searchParams.fromDate,
      toDate: searchParams.toDate,
      page: currentPage - 1,
      size: itemsPerPage,
      exception: 0 // exception = 0 for VPS Policy
    }),
    staleTime: 10000
  })

  const policies = searchResult?.content || (Array.isArray(searchResult) ? searchResult : [])
  const totalItems = searchResult?.totalElements !== undefined ? Number(searchResult.totalElements) : policies.length
  const totalPages = searchResult?.totalPages !== undefined ? Number(searchResult.totalPages) : Math.ceil(policies.length / itemsPerPage)

  // 4. Mutation to create/update VPS policy (creates a ticket)
  const createMutation = useMutation({
    mutationFn: policyService.create,
    onSuccess: (res) => {
      toast.success(`Đã gửi yêu cầu cấu hình chính sách VPS! Ticket ID: ${res.data || res}`)
      queryClient.invalidateQueries({ queryKey: ['vps-policies'] })
      setIsModalOpen(false)
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi cấu hình chính sách VPS!')
    }
  })

  // 5. Mutation to approve/reject policy ticket
  const approveMutation = useMutation({
    mutationFn: policyService.approve,
    onSuccess: (_, variables) => {
      const action = variables.isApproved === 1 ? 'Phê duyệt' : 'Từ chối'
      toast.success(`${action} chính sách VPS thành công!`)
      queryClient.invalidateQueries({ queryKey: ['vps-policies'] })
    },
    onError: (err, variables) => {
      const action = variables.isApproved === 1 ? 'Phê duyệt' : 'Từ chối'
      toast.error(`Lỗi khi thực hiện ${action.toLowerCase()}: ${err.message}`)
    }
  })

  // Combined Loading state for UI controls
  const isTableLoading = isSearchLoading || createMutation.isPending || approveMutation.isPending

  // Search options
  const operatorOptions = operators.map(op => ({
    value: op.code,
    label: `${op.name} (${op.code})`
  }))

  const approveStatusOptions = [
    { value: 0, label: 'Chưa duyệt' },
    { value: 1, label: 'Đã duyệt' },
    { value: 2, label: 'Từ chối' }
  ]

  const activeStatusOptions = [
    { value: 1, label: 'Hiệu lực' },
    { value: 0, label: 'Chưa hiệu lực' },
    { value: 2, label: 'Từ chối' }
  ]

  // Reset page to 1 khi searchParams thay đổi
  useEffect(() => {
    setCurrentPage(1)
  }, [searchParams])

  // Pagination Logic
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + policies.length
  const paginatedPolicies = policies

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Trigger search
  const handleSearch = () => {
    // Validate ngày to time luôn lớn hơn hoặc bằng ngày from time
    if (tempFromDate && tempToDate && tempFromDate > tempToDate) {
      toast.error('Ngày đến ngày phải luôn lớn hơn hoặc bằng từ ngày!')
      return
    }
    setSearchParams({
      operatorCode: filterOperator ? filterOperator.value : '',
      approveStatus: filterApproveStatus ? filterApproveStatus.value : '',
      activeStatus: filterActiveStatus ? filterActiveStatus.value : '',
      fromDate: tempFromDate ? formatDateToYMD(tempFromDate) : '2026-01-01',
      toDate: tempToDate ? formatDateToYMD(tempToDate) : '2026-12-31'
    })
  }

  // Clear filters
  const handleClearFilters = () => {
    setFilterOperator(null)
    setFilterApproveStatus(null)
    setFilterActiveStatus(null)
    setTempFromDate(new Date('2026-01-01'))
    setTempToDate(new Date('2026-12-31'))
    setSearchParams({
      operatorCode: '',
      approveStatus: '',
      activeStatus: '',
      fromDate: '2026-01-01',
      toDate: '2026-12-31'
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' or 'edit'
  const [selectedPolicy, setSelectedPolicy] = useState(null)

  // Modal Form State
  const [formOperatorCode, setFormOperatorCode] = useState('')
  const [formOtpStatus, setFormOtpStatus] = useState(0) // 0: ON, 1: OFF
  const [formOtpCondition, setFormOtpCondition] = useState('0')
  const [formBioStatus, setFormBioStatus] = useState(0) // 0: ON, 1: OFF
  const [formBioCondition, setFormBioCondition] = useState('0')
  
  const [formErrors, setFormErrors] = useState({})

  // Modal Handlers
  const handleOpenAdd = () => {
    setModalMode('add')
    setSelectedPolicy(null)
    setFormOperatorCode(operatorOptions[0]?.value || '')
    setFormOtpStatus(0)
    setFormOtpCondition('0')
    setFormBioStatus(0)
    setFormBioCondition('0')
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEdit = (policy) => {
    setModalMode('edit')
    setSelectedPolicy(policy)
    setFormOperatorCode(policy.operatorCode)
    setFormOtpStatus(Number(policy.otpStatus))
    setFormOtpCondition(String(policy.otpCondition || 0))
    setFormBioStatus(Number(policy.bioStatus))
    setFormBioCondition(String(policy.bioCondition || 0))
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()

    const formData = {
      operatorCode: formOperatorCode,
      otpStatus: Number(formOtpStatus),
      otpCondition: Number(formOtpCondition),
      bioStatus: Number(formBioStatus),
      bioCondition: Number(formBioCondition)
    }

    try {
      await policySchema.validate(formData, { abortEarly: false })
      
      const payload = {
        operatorCode: formOperatorCode.trim(),
        accountCode: '', // Bỏ trống cho VPS Policy
        otpStatus: Number(formOtpStatus),
        otpCondition: Number(formOtpCondition),
        bioStatus: Number(formBioStatus),
        bioCondition: Number(formBioCondition)
      }

      createMutation.mutate(payload)
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        const validationErrors = {}
        err.inner.forEach(error => {
          validationErrors[error.path] = error.message
        })
        setFormErrors(validationErrors)
      } else {
        toast.error('Lỗi kiểm tra tính hợp lệ dữ liệu!')
      }
    }
  }

  const handleApprove = (ticketId, isApproved) => {
    const action = isApproved === 1 ? 'phê duyệt' : 'từ chối'
    if (window.confirm(`Bạn có chắc chắn muốn ${action} chính sách này không?`)) {
      approveMutation.mutate({ ticketId, isApproved })
    }
  }

  const vpsColumns = [
    { header: 'STT', render: (_, classes, index) => startIndex + index + 1, width: '50px' },
    { 
      header: 'Tên nghiệp vụ', 
      render: (p) => {
        const op = operators.find(o => o.code === p.operatorCode)
        return op ? op.name : (p.operatorName || p.operatorCode)
      },
      style: { fontWeight: 600 }, 
      width: '1.8fr' 
    },
    { 
      header: 'Mã Code', 
      render: (p, classes) => (
        <span className={`${classes.badge} ${classes.badgeInfo}`}>{p.operatorCode}</span>
      ),
      width: '1.2fr'
    },
    { 
      header: 'OTP', 
      render: (p, classes) => (
        <span className={`${classes.badge} ${Number(p.otpStatus) === 0 ? classes.badgeSuccess : classes.badgeDanger}`}>
          {Number(p.otpStatus) === 0 ? 'Có' : 'Không'}
        </span>
      ),
      width: '0.6fr'
    },
    { 
      header: 'Điều kiện OTP', 
      render: (p) => {
        if (Number(p.otpStatus) !== 0) return '-'
        return Number(p.otpCondition) === 0 ? 'Tất cả' : `amount >= ${Number(p.otpCondition).toLocaleString('vi-VN')}`
      },
      width: '1.3fr' 
    },
    { 
      header: 'BIO', 
      render: (p, classes) => (
        <span className={`${classes.badge} ${Number(p.bioStatus) === 0 ? classes.badgeSuccess : classes.badgeDanger}`}>
          {Number(p.bioStatus) === 0 ? 'Có' : 'Không'}
        </span>
      ),
      width: '0.6fr'
    },
    { 
      header: 'Điều kiện BIO', 
      render: (p) => {
        if (Number(p.bioStatus) !== 0) return '-'
        return Number(p.bioCondition) === 0 ? 'Tất cả' : `amount >= ${Number(p.bioCondition).toLocaleString('vi-VN')}`
      },
      width: '1.3fr' 
    },
    {
      header: 'Trạng thái duyệt',
      render: (p, classes) => {
        const status = Number(p.approveStatus)
        if (status === 0) return <span className={classes.badge} style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>Chờ duyệt</span>
        if (status === 1) return <span className={`${classes.badge} ${classes.badgeSuccess}`}>Đã duyệt</span>
        if (status === 2) return <span className={`${classes.badge} ${classes.badgeDanger}`}>Từ chối</span>
        return <span className={`${classes.badge} ${classes.badgeSecondary}`}>Chưa duyệt</span>
      },
      width: '1.1fr'
    },
    {
      header: 'Hiệu lực',
      render: (p, classes) => {
        const status = Number(p.activeStatus)
        if (status === 1) return <span className={`${classes.badge} ${classes.badgeSuccess}`}>Hiệu lực</span>
        if (status === 0) return <span className={`${classes.badge} ${classes.badgeSecondary}`}>Chưa hiệu lực</span>
        if (status === 2) return <span className={`${classes.badge} ${classes.badgeDanger}`}>Từ chối</span>
        return <span className={`${classes.badge} ${classes.badgeSecondary}`}>Chưa hiệu lực</span>
      },
      width: '1fr'
    },
    {
      header: 'Ticket ID',
      render: (p) => p.ticketId || '-',
      style: { fontSize: '12px', color: 'var(--text-muted)' },
      width: '1.2fr'
    },
    {
      header: 'Ngày tạo',
      render: (p) => formatDateTime(p.createdDate),
      style: { fontSize: '12px', color: 'var(--text-muted)' },
      width: '1.4fr'
    },
    {
      header: 'Ngày hiệu lực',
      render: (p) => formatDateTime(p.lastModifiedDate),
      style: { fontSize: '12px', color: 'var(--text-muted)' },
      width: '1.4fr'
    },
    { 
      header: 'Thao tác', 
      render: (p, classes) => {
        const isPending = Number(p.approveStatus) === 0
        return (
          <div className={classes.actionButtons} style={{ display: 'flex', gap: '6px' }}>
            {isPending && p.ticketId ? (
              <>
                <button 
                  className={styles.btnApprove} 
                  style={{
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    border: '1px solid #a7f3d0',
                    padding: '5px 9px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleApprove(p.ticketId, 1)}
                  disabled={isTableLoading}
                >
                  Duyệt
                </button>
                <button 
                  className={styles.btnReject} 
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    border: '1px solid #fca5a5',
                    padding: '5px 9px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  onClick={() => handleApprove(p.ticketId, 0)}
                  disabled={isTableLoading}
                >
                  Từ chối
                </button>
              </>
            ) : (
              <button className={classes.btnEdit} onClick={() => handleOpenEdit(p)} disabled={isTableLoading}>
                <FontAwesomeIcon icon={faPen} />
                Cấu hình
              </button>
            )}
          </div>
        )
      },
      width: '1.4fr'
    }
  ]

  return (
    <div className={styles.pageContainer}>
      {/* Page Title & Desc */}
      <div className={styles.pageHeader}>
        <h1>Chính sách VPS</h1>
        <p>Khai báo loại hình xác thực mặc định (OTP/BIO) và điều kiện thực hiện của từng nghiệp vụ hệ thống</p>
      </div>

      {/* API Error Banner */}
      {isError && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '2px',
          color: '#ef4444',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left'
        }}>
          <span>⚠️</span>
          <span>Không thể tải danh sách chính sách: <strong>{error?.message || 'Lỗi kết nối đến máy chủ API'}</strong></span>
        </div>
      )}

      {/* Compact Filter Card */}
      <div className={styles.filterCard} onKeyDown={handleKeyDown}>
        <div className={styles.filterGrid}>
          <div className={styles.filterField} style={{ maxWidth: '280px', flex: 1.5 }}>
            <label>Nghiệp vụ</label>
            <SearchableSelect
              options={operatorOptions}
              value={filterOperator}
              onChange={(opt) => setFilterOperator(opt)}
              placeholder="Tất cả nghiệp vụ..."
              isClearable
            />
          </div>

          <div className={styles.filterField} style={{ maxWidth: '180px', flex: 1 }}>
            <label>Trạng thái duyệt</label>
            <Select
              options={approveStatusOptions}
              value={filterApproveStatus}
              onChange={(opt) => setFilterApproveStatus(opt)}
              placeholder="Tất cả..."
              styles={customSelectStyles}
              isClearable
            />
          </div>

          <div className={styles.filterField} style={{ maxWidth: '180px', flex: 1 }}>
            <label>Hiệu lực</label>
            <Select
              options={activeStatusOptions}
              value={filterActiveStatus}
              onChange={(opt) => setFilterActiveStatus(opt)}
              placeholder="Tất cả..."
              styles={customSelectStyles}
              isClearable
            />
          </div>

          {/* Date range filters */}
          <div className={styles.dateInputGroup}>
            <label>Từ ngày</label>
            <div className={styles.dateInputWrapper}>
              <FontAwesomeIcon icon={faCalendarDays} className={styles.calendarIcon} />
              <DatePicker
                selected={tempFromDate}
                onChange={(date) => setTempFromDate(date)}
                dateFormat="dd/MM/yyyy"
                locale="vi"
                placeholderText="Chọn ngày..."
                maxDate={tempToDate || undefined}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>

          <div className={styles.dateInputGroup}>
            <label>Đến ngày</label>
            <div className={styles.dateInputWrapper}>
              <FontAwesomeIcon icon={faCalendarDays} className={styles.calendarIcon} />
              <DatePicker
                selected={tempToDate}
                onChange={(date) => setTempToDate(date)}
                dateFormat="dd/MM/yyyy"
                locale="vi"
                placeholderText="Chọn ngày..."
                minDate={tempFromDate || undefined}
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
          
          <div className={styles.filterActions}>
            <button className={styles.btnSecondary} onClick={handleClearFilters} disabled={isTableLoading}>
              <FontAwesomeIcon icon={faEraser} />
              Xóa
            </button>
            <button className={styles.btnPrimary} onClick={handleSearch} disabled={isTableLoading}>
              <FontAwesomeIcon icon={faSearch} />
              Tìm
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className={styles.contentCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Danh mục chính sách VPS</h2>
          <button className={styles.btnPrimary} onClick={handleOpenAdd} disabled={isTableLoading} style={{
            padding: '7px 14px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'linear-gradient(135deg, #8229e3 0%, #9333ea 100%)',
            border: 'none',
            color: '#ffffff'
          }}>
            <FontAwesomeIcon icon={faPlus} />
            Thêm mới
          </button>
        </div>

        <DataTable 
          columns={vpsColumns}
          data={paginatedPolicies}
          isLoading={isTableLoading}
          emptyMessage="Không tìm thấy chính sách VPS nào!"
        />

        {/* Pagination */}
        {isPaginationEnabled && totalItems > 0 && (
          <div className={styles.paginationBar}>
            <div className={styles.paginationInfo}>
              Hiển thị <strong>{startIndex + 1}</strong> - <strong>{Math.min(endIndex, totalItems)}</strong> trên tổng số <strong>{totalItems}</strong> chính sách
            </div>
            
            <div className={styles.pageSizeSelector}>
              <span>Hiển thị</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10))
                  setCurrentPage(1)
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span>bản ghi/trang</span>
            </div>
            
            <div className={styles.paginationControls}>
              <button 
                className={styles.pageBtn}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isTableLoading}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ''}`}
                  onClick={() => handlePageChange(page)}
                  disabled={isTableLoading}
                >
                  {page}
                </button>
              ))}
              
              <button 
                className={styles.pageBtn}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isTableLoading}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Configure/Add Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '560px' }}>
            <div className={styles.modalHeader}>
              <h3>{modalMode === 'add' ? 'THÊM MỚI CHÍNH SÁCH VPS' : `CẤU HÌNH CHÍNH SÁCH: ${selectedPolicy?.operatorCode}`}</h3>
              <button className={styles.btnClose} onClick={() => setIsModalOpen(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                
                {/* Chọn nghiệp vụ - Lock during Edit */}
                <div className={styles.modalFormGroup} style={{ marginBottom: '16px' }}>
                  <label htmlFor="operatorSelect">Nghiệp vụ áp dụng</label>
                  {modalMode === 'add' ? (
                    <Select
                      options={operatorOptions}
                      value={operatorOptions.find(o => o.value === formOperatorCode)}
                      onChange={(opt) => setFormOperatorCode(opt ? opt.value : '')}
                      styles={customSelectStyles}
                      placeholder="Chọn nghiệp vụ..."
                    />
                  ) : (
                    <input 
                      type="text" 
                      id="operatorSelect" 
                      value={operators.find(o => o.code === formOperatorCode)?.name || formOperatorCode} 
                      disabled 
                      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                    />
                  )}
                  {formErrors.operatorCode && <span className={styles.errorMsg} style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{formErrors.operatorCode}</span>}
                </div>

                {/* OTP Cấu hình */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '12px', marginBottom: '16px', textAlign: 'left' }}>
                  <div className={styles.modalFormGroup} style={{ marginBottom: 0 }}>
                    <label>Xác thực OTP</label>
                    <Select
                      options={[
                        { value: 0, label: 'Có (ON)' },
                        { value: 1, label: 'Không (OFF)' }
                      ]}
                      value={{ value: formOtpStatus, label: formOtpStatus === 0 ? 'Có (ON)' : 'Không (OFF)' }}
                      onChange={(opt) => setFormOtpStatus(opt ? opt.value : 0)}
                      styles={customSelectStyles}
                    />
                  </div>
                  <div className={styles.modalFormGroup} style={{ marginBottom: 0 }}>
                    <label htmlFor="otpCond">Hạn mức thực hiện OTP (VND)</label>
                    <input 
                      type="number" 
                      id="otpCond" 
                      value={formOtpCondition} 
                      onChange={(e) => setFormOtpCondition(e.target.value)}
                      placeholder="VD: 10000000"
                      disabled={formOtpStatus === 1}
                      style={formOtpStatus === 1 ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                    />
                    {formErrors.otpCondition && <span className={styles.errorMsg} style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{formErrors.otpCondition}</span>}
                  </div>
                </div>

                {/* BIO Cấu hình */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '12px', textAlign: 'left' }}>
                  <div className={styles.modalFormGroup} style={{ marginBottom: 0 }}>
                    <label>Xác thực BIO (Sinh trắc)</label>
                    <Select
                      options={[
                        { value: 0, label: 'Có (ON)' },
                        { value: 1, label: 'Không (OFF)' }
                      ]}
                      value={{ value: formBioStatus, label: formBioStatus === 0 ? 'Có (ON)' : 'Không (OFF)' }}
                      onChange={(opt) => setFormBioStatus(opt ? opt.value : 0)}
                      styles={customSelectStyles}
                    />
                  </div>
                  <div className={styles.modalFormGroup} style={{ marginBottom: 0 }}>
                    <label htmlFor="bioCond">Hạn mức thực hiện BIO (VND)</label>
                    <input 
                      type="number" 
                      id="bioCond" 
                      value={formBioCondition} 
                      onChange={(e) => setFormBioCondition(e.target.value)}
                      placeholder="VD: 20000000"
                      disabled={formBioStatus === 1}
                      style={formBioStatus === 1 ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}}
                    />
                    {formErrors.bioCondition && <span className={styles.errorMsg} style={{ color: '#ef4444', fontSize: '11.5px', marginTop: '3px', display: 'block' }}>{formErrors.bioCondition}</span>}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnCancel} onClick={() => setIsModalOpen(false)} disabled={isTableLoading}>
                  QUAY LẠI
                </button>
                <button type="submit" className={styles.btnSave} disabled={isTableLoading}>
                  {createMutation.isPending ? 'SAVING...' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
