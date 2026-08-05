// a_styles/style_faculties.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
    fontWeight: '700',
    color: '#ffffff',
        flex: 1,
    textAlign:'center'
  },
  addFacultyButton: {
    padding: 4,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7A8F',
  },
  sectionContainer: {
    paddingBottom: 20,
  },
  facultyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  facultyHeader: {
    marginBottom: 12,
  },
  facultyInfo: {
    flex: 1,
  },
  facultyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  codeChip: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  facultyActions: {
    flexDirection: 'row',
    gap: 16,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2332',
  },
  departmentList: {
    borderTopWidth: 1,
    borderTopColor: '#E8ECF4',
    paddingTop: 12,
  },
  departmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  departmentName: {
    fontSize: 14,
    color: '#1A2332',
    flex: 1,
  },
  smallChip: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  deptActions: {
    flexDirection: 'row',
    gap: 12,
  },
  noDepartmentText: {
    fontSize: 13,
    color: '#6B7A8F',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A2332',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D9E6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFBFC',
  },
  facultyPicker: {
    marginTop: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2332',
    marginBottom: 8,
  },
  pickerScroll: {
    flexDirection: 'row',
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
    marginRight: 8,
  },
  pickerItemSelected: {
    backgroundColor: '#4A90E2',
  },
  pickerText: {
    fontSize: 14,
    color: '#1A2332',
  },
  pickerTextSelected: {
    color: '#FFFFFF',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F2F5',
  },
  cancelButtonText: {
    color: '#1A2332',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});