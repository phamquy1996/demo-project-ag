import React, { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faSearch, 
  faChevronLeft,
  faChevronRight,
  faEraser,
  faRotate,
  faShieldHalved,
  faArrowsRotate
} from '@fortawesome/free-solid-svg-icons'
import toast from 'react-hot-toast'
import Select from 'react-select'
import { useQuery } from '@tanstack/react-query'
import DataTable from '../../components/DataTable/DataTable'
import { policyService } from '../../api/policyService'
import { operatorService } from '../../api/operatorService'
import styles from './ActivePolicy.module.scss'

export default function ActivePolicy() {
  // 1. Fetch operators list for filter dropdown
  const [operators, setOperators] = useState([])
  useEffect(() => {
    operatorService.getAll()
      .then(data => {
        setOperators(Array.isArray(data) ? data : [])
      })
      .catch(err => {
        console.error('Error fetching operators:', err)
      })
  }, [])

  const operatorOptions = [
    { value: '', label: 'Tất cả nghiệp vụ' },
    ...operators.map(op => ({ value: op.code, label: `${op.name} (${op.code})` }))
  ]

  // React-select custom styles for match theme
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '34px',
      height: '34px',
      borderRadius: '8px',
      borderColor: 'var(--input-border)',
      backgroundColor: 'var(--input-bg)',
      color: 'var(--text-primary)',
      fontSize: '13px',
      boxShadow: 'none',
      width: '100%',
      '&:hover': {
        borderColor: '#8229e3'
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '32px',
      padding: '0 8px'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0px',
      color: 'var(--text-primary)'
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '32px'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'var(--text-primary)'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'var(--text-muted)',
      fontSize: '12px'
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
    }),
    option: (provided, state) => ({
      ...provided,
      fontSize: '13px',
      backgroundColor: state.isSelected 
        ? '#8229e3' 
        : state.isFocused 
          ? 'var(--bg-app)' 
          : 'transparent',
      color: state.isSelected 
        ? '#ffffff' 
        : 'var(--text-primary)',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#8229e3'
      }
    }),
    container: (provided) => ({
      ...provided,
      width: '100%'
    })
  }

  // 2. Filter states for UI Search
  const [filterOperator, setFilterOperator] = useState(null)
  const [tempAccountCode, setTempAccountCode] = useState('')

  const [searchParams, setSearchParams] = useState({
    operatorCode: '',
    accountCode: ''
  })

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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

  // 3. React Query: Fetch Active policies list
  const { data: rawList = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['active-policies', searchParams],
    queryFn: () => policyService.getActivePolicy({
      operatorCode: searchParams.operatorCode,
      accountCode: searchParams.accountCode
    }),
    staleTime: 10000
  })

  const policiesList = Array.isArray(rawList) ? rawList : []

  // Reset page when search parameters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchParams, itemsPerPage])

  // Pagination logic (client-side)
  const totalItems = policiesList.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedList = policiesList.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Trigger search
  const handleSearch = () => {
    setSearchParams({
      operatorCode: filterOperator ? filterOperator.value : '',
      accountCode: tempAccountCode.trim()
    })
    refetch()
  }

  // Clear filters
  const handleClearFilters = () => {
    setFilterOperator(null)
    setTempAccountCode('')
    setSearchParams({
      operatorCode: '',
      accountCode: ''
    })
    refetch()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Split and render methods (BIO|OTP) as premium badges
  const renderActiveMethods = (p) => {
    if (!p.methodActive) return '-'
    const methods = p.methodActive.split('|')
    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {methods.map((method, idx) => {
          let badgeColor = { backgroundColor: '#e2e8f0', color: '#475569' }
          if (method === 'BIO') {
            badgeColor = { backgroundColor: '#d1fae5', color: '#065f46' } // green
          } else if (method === 'OTP') {
            badgeColor = { backgroundColor: '#e0f2fe', color: '#0369a1' } // blue
          }
          return (
            <span 
              key={idx} 
              style={{
                display: 'inline-block',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                ...badgeColor
              }}
            >
              {method}
            </span>
          )
        })}
      </div>
    )
  }

  // Split and format corresponding conditions (e.g. 88008899|88008899)
  const renderMethodConditions = (p) => {
    if (!p.methodActive) return '-'
    const methods = p.methodActive.split('|')
    const conditions = p.methodCondition ? p.methodCondition.split('|') : []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', textAlign: 'left' }}>
        {methods.map((method, i) => {
          const cond = conditions[i]
          const condNum = cond ? Number(cond) : 0
          const condStr = condNum === 0 ? 'Tất cả' : `>= ${condNum.toLocaleString('vi-VN')} đ`
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{method}:</span>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{condStr}</span>
            </div>
          )
        })}
      </div>
    )
  }

  // Color-coded badges for explanation types
  const renderExplain = (p) => {
    const text = p.explain || '-'
    let style = { backgroundColor: '#f1f5f9', color: '#475569' }
    if (text.toLowerCase().includes('ngoại lệ')) {
      style = { backgroundColor: '#fee2e2', color: '#991b1b' }
    } else if (text.toLowerCase().includes('vps')) {
      style = { backgroundColor: '#e0f2fe', color: '#0369a1' }
    } else if (text.toLowerCase().includes('cài đặt')) {
      style = { backgroundColor: '#d1fae5', color: '#065f46' }
    }
    return (
      <span style={{ 
        display: 'inline-block',
        padding: '4px 8px', 
        borderRadius: '6px', 
        fontSize: '11.5px', 
        fontWeight: 600,
        ...style 
      }}>
        {text}
      </span>
    )
  }

  const columns = [
    { header: 'STT', render: (_, classes, index) => startIndex + index + 1, width: '50px' },
    { 
      header: 'Tên chính sách/Nghiệp vụ', 
      render: (p) => p.operatorName || '-',
      style: { fontWeight: 600 }, 
      width: '2fr' 
    },
    { 
      header: 'Mã nghiệp vụ', 
      render: (p, classes) => (
        <span className={`${classes.badge} ${classes.badgeInfo}`}>{p.operatorCode}</span>
      ),
      width: '1.2fr'
    },
    { 
      header: 'Mã KH', 
      render: (p) => p.accountCode || '-',
      style: { fontWeight: 500 },
      width: '1fr'
    },
    { 
      header: 'Tên khách hàng', 
      render: (p) => p.accountName || '-',
      width: '1.4fr'
    },
    { 
      header: 'Chính sách hiệu lực', 
      render: renderActiveMethods,
      width: '1.4fr'
    },
    { 
      header: 'Điều kiện áp dụng', 
      render: renderMethodConditions,
      width: '1.6fr'
    },
    {
      header: 'Diễn giải loại hình',
      render: renderExplain,
      width: '1.6fr'
    },
    {
      header: 'Ngày hiệu lực',
      render: (p) => formatDateTime(p.activeDate),
      style: { fontSize: '11.5px', color: 'var(--text-muted)' },
      width: '1.4fr'
    },
    {
      header: 'Ngày tạo',
      render: (p) => formatDateTime(p.createdDate),
      style: { fontSize: '11.5px', color: 'var(--text-muted)' },
      width: '1.4fr'
    },
    {
      header: 'Ngày cập nhật',
      render: (p) => formatDateTime(p.lastModifiedDate),
      style: { fontSize: '11.5px', color: 'var(--text-muted)' },
      width: '1.4fr'
    }
  ]

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Chính sách hiệu lực hiện tại của KH</h1>
        <p>Tra cứu nhanh thông tin cấu hình chính sách (OTP/BIO) đang có hiệu lực thực tế của từng khách hàng</p>
      </div>

      {isError && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          padding: '12px 16px',
          color: '#ef4444',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textAlign: 'left'
        }}>
          <span>⚠️</span>
          <span>Không thể tải danh sách chính sách hiệu lực: <strong>{error?.message || 'Lỗi kết nối API'}</strong></span>
        </div>
      )}

      {/* Filter Card */}
      <div className={styles.filterCard} onKeyDown={handleKeyDown}>
        <div className={styles.filterGrid}>
          <div className={styles.filterField} style={{ maxWidth: '280px', flex: 1.5 }}>
            <label>Nghiệp vụ</label>
            <Select
              options={operatorOptions}
              value={filterOperator}
              onChange={(opt) => setFilterOperator(opt)}
              placeholder="Tất cả nghiệp vụ..."
              styles={customSelectStyles}
              isClearable
            />
          </div>

          <div className={styles.filterField} style={{ maxWidth: '200px', flex: 1 }}>
            <label>Mã khách hàng</label>
            <div className={styles.inputWithIcon} style={{ width: '100%' }}>
              <input 
                type="text" 
                value={tempAccountCode} 
                onChange={(e) => setTempAccountCode(e.target.value)} 
                placeholder="Nhập mã khách hàng..."
              />
            </div>
          </div>

          <div className={styles.filterActions}>
            <button className={styles.btnSecondary} onClick={handleClearFilters} disabled={isLoading}>
              <FontAwesomeIcon icon={faEraser} />
              Xóa
            </button>
            <button className={styles.btnSecondary} onClick={() => refetch()} disabled={isLoading} title="Tải lại dữ liệu">
              <FontAwesomeIcon icon={faRotate} spin={isLoading} />
              Tải lại
            </button>
            <button className={styles.btnPrimary} onClick={handleSearch} disabled={isLoading}>
              <FontAwesomeIcon icon={faSearch} />
              Tìm
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className={styles.contentCard}>
        <div className={styles.cardHeader}>
          <h2>Danh sách chính sách hiệu lực ({totalItems} bản ghi)</h2>
        </div>

        <DataTable 
          columns={columns} 
          data={paginatedList} 
          isLoading={isLoading} 
        />

        {/* Client-side Pagination footer */}
        {totalItems > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Hiển thị từ <strong>{startIndex + 1}</strong> đến <strong>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> trong tổng số <strong>{totalItems}</strong> bản ghi
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Xem</span>
                <select 
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
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
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <button 
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.5 : 1
                  }}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: currentPage === page ? '1px solid #8229e3' : '1px solid var(--border-color)',
                      backgroundColor: currentPage === page ? '#8229e3' : 'var(--bg-card)',
                      color: currentPage === page ? '#ffffff' : 'var(--text-primary)',
                      fontWeight: currentPage === page ? 'bold' : 'normal',
                      cursor: 'pointer'
                    }}
                    onClick={() => handlePageChange(page)}
                    disabled={isLoading}
                  >
                    {page}
                  </button>
                ))}
                
                <button 
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.5 : 1
                  }}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
