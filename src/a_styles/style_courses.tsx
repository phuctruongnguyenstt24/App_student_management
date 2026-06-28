// a_styles/style_courses.tsx
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a2332',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 4,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2332',
  },
  courseCount: {
    fontSize: 14,
    color: '#6b7a8f',
    backgroundColor: '#e8ecf1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addFacultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addFacultyText: {
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8ecf1',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7a8f',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9aa6b5',
    marginTop: 4,
  },
  
  // ============= FACULTY STYLES =============
  facultyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
 facultyHeader: {
    marginBottom: 10,
  },

  facultyInfo: {
    flexDirection: "column",
  },

  facultyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

 

  facultyName: {
    marginTop: 8,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },

  codeChip: {
    backgroundColor: '#245dbe',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#e41111',
    alignSelf:'flex-start',
    marginBottom:10,
  },
  
  // Faculty actions - gọn nhẹ
  facultyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9, // Khoảng cách giữa các nút
  },
  
  // ============= DEPARTMENT STYLES =============
  departmentList: {
    marginTop: 8,
    marginLeft: 4,
  },
  departmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 6,
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  departmentName: {
    fontSize: 14,
    color: '#1962e1',
    marginLeft: 6,
    marginRight: 8,
    flex: 1,
  },
  smallChip: {
    backgroundColor: '#e8ecf1',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 10,
  },
  
  // Department actions - gọn nhẹ
  deptActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noDepartmentText: {
    fontSize: 13,
    color: '#9aa6b5',
    fontStyle: 'italic',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  divider: {
    marginTop: 12,
    backgroundColor: '#e8ecf1',
  },
  
  // ============= COURSE STYLES =============
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseCodeContainer: {
    backgroundColor: '#e8f0fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  courseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a2332',
    marginBottom: 8,
  },
  courseInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#4a5568',
    marginLeft: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6b7a8f',
    marginTop: 4,
  },
  
  // ============= MODAL STYLES =============
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2332',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a2332',
    marginBottom: 6,
  },
  required: {
    color: '#dc3545',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d8e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1a2332',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e8ecf1',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#d1d8e0',
  },
  cancelButtonText: {
    color: '#4a5568',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  
  // ============= PICKER STYLES (cho Department) =============
  facultyPicker: {
    marginTop: 12,
    marginBottom: 4,
  },
  pickerScroll: {
    flexDirection: 'row',
    marginTop: 6,
    maxHeight: 60,
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: 80,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  pickerText: {
    fontSize: 13,
    color: '#333',
  },
  pickerTextSelected: {
    color: '#fff',
  },
  
  // ============= LOADING STYLES =============
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7a8f',
    fontWeight: '500',
  },
});