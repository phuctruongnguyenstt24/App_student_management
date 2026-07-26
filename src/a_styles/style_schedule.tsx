import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Main Container & Header
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50, // Dành cho các dòng máy có notch / tai thỏ
    paddingBottom: 15,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1890ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },

  // Loading & Empty State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 8,
    color: '#1890ff',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Accordion (Danh sách theo Lớp)
  accordionCard: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f5ff',
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  accordionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionSubText: {
    marginRight: 10,
    color: '#666',
  },
  accordionBody: {
    padding: 10,
  },

  // Schedule Card Item
  scheduleCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#262626',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    color: '#555',
    fontSize: 14,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  semesterText: {
    fontSize: 13,
    color: '#8c8c8c',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    padding: 6,
    marginRight: 12,
    backgroundColor: '#e6f7ff',
    borderRadius: 6,
  },
  deleteButton: {
    padding: 6,
    backgroundColor: '#fff1f0',
    borderRadius: 6,
  },

  // Modal Layout & Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  // Form Controls
  formGroup: {
    marginBottom: 16,
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#434343',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 50,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#1890ff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#1890ff',
  },
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },

  // Filter Section
  filterContainer: {
    backgroundColor: '#f0f5ff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#d6e4ff',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d39c4',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterGroup: {
    marginRight: 12,
    width: 140,
  },
  filterLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },

  filterPickerContainer: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
    height: 50, // Tăng từ 40 lên 50 để không bị che chữ
    justifyContent: 'center',
  },
  filterPicker: {
    width: '100%',
    height: 50, // Tăng chiều cao tương ứng với container
  },

  resetFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    height: 40,
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1890ff',
    borderRadius: 6,
  },
  resetFilterText: {
    color: '#1890ff',
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '600',
  },

  // Selection & Action Helpers
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#e6f7ff',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1890ff',
  },
  selectAllText: {
    color: '#1890ff',
    fontSize: 12,
    fontWeight: '500',
  },

  // Day Picker Styles
  dayPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dayButtonTextSelected: {
    color: '#fff',
  },
  selectedDaysText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Conflict Alert Styles
  conflictContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    borderWidth: 1,
  },
  conflictError: {
    backgroundColor: '#fff2f0',
    borderColor: '#ff4d4f',
  },
  conflictSuccess: {
    backgroundColor: '#f6ffed',
    borderColor: '#52c41a',
  },
  conflictText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  submitButtonWarning: {
    backgroundColor: '#faad14',
  },

  // Form Submit Actions
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d9d9d9',
  },
  submitButton: {
    backgroundColor: '#1890ff',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#595959',
  },
  submitButtonText: {
    color: '#fff',
  },
});

export default styles;