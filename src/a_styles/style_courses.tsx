import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // 1. Trạng thái Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '500',
  },

  // 2. Bố cục chính & Header
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
 header: {
      backgroundColor: '#214D8A',
    padding: 16,
    paddingTop: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
        flex: 1,
    textAlign:'center'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    marginRight: 14,
    padding: 4,
  },
  addButton: {
    padding: 4,
  },

  // 3. Khu vực Bộ lọc (Filter Section)
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e7e2',
  },
  filterRow: {
    flexDirection: 'row',
   
    marginBottom: 12,
  },
  filterGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b6464',
    marginBottom: 6,
  },
  pickerWrapper: {
 
    borderWidth: 1,
    borderColor: '#060606',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  picker: {
    height: 52,
    width: '100%',
    backgroundColor: 'transparent',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  clearFilterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  clearFilterText: {
    color: '#dc3545',
    fontWeight: '600',
    fontSize: 13,
  },
  filterResultText: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },

  // 4. Danh sách môn học (Body & Cards)
  body: {
    flex: 1,
  },
  sectionContainer: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  courseCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },

  // Thẻ môn học (Course Card)
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCodeContainer: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseCode: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 13,
  },
  courseActions: {
    flexDirection: 'row',
    gap: 16, // Tạo khoảng cách đều giữa các icon hành động
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 10,
  },

  // Thông tin nhỏ (Credits, Faculty, Semester...)
  courseInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
    fontWeight: '500',
  },

  // Danh sách ngành áp dụng (Chips)
  departmentsContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  departmentsLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  departmentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  deptChip: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
  },
  deptChipText: {
    color: '#16a34a',
    fontSize: 11,
    fontWeight: '600',
  },
  courseDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },

  // 5. Trạng thái danh sách trống (Empty State)
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },

  // 6. Giao diện Modal (Thêm/Sửa môn học)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end', // Xuất hiện từ dưới lên thanh thoát
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%', // Không chiếm hết màn hình để tạo cảm giác lớp phủ đè
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalBody: {
    padding: 16,
  },
  formGroup: {
    marginTop: 14,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  formHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top', // Giúp text bắt đầu từ góc trên bên trái trên Android
  },

  // Trình chọn ngành trong Form (Multi-selector)
  departmentSelector: {
    maxHeight: 150,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  deptSelectorItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  deptSelectorItemSelected: {
    backgroundColor: '#e0f2fe',
  },
  deptSelectorText: {
    fontSize: 14,
    color: '#334155',
  },
  deptSelectorTextSelected: {
    color: '#0369a1',
    fontWeight: '600',
  },
  noDeptText: {
    padding: 12,
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 13,
  },

  // Footer của Modal (Nút Hủy / Lưu)
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});

export default styles;