// a_styles/style_create_std.tsx
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2332',
    flex: 1,
  },
  headerRight: {
    width: 36,
  },
  
  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  
  // Input
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    color:'#c72323',
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  
  // Text styles for validation
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  successText: {
    fontSize: 12,
    color: '#28a745',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#ffc107',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  
  // Picker
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0d4bb8',
    marginBottom: 4,
  },
  pickerRow : {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:'#fff',
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d8e0',
    overflow: 'hidden',
  },
  pickerList: {
    margin: 0,
    padding: 0,
  },
  
  // Button
  createButton: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#a0c4e8',
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7a8f',
    fontWeight: '500',
    marginTop: 12,
  },
  
  // Modal
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
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a2332',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  modalPicker: {
    marginVertical: 8,
  },
  modalPickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a2332',
    marginBottom: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalCancel: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d8e0',
    marginRight: 12, // Thay thế cho gap
  },
  modalSave: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '500',
  },
  
  // Additional styles for create-student.tsx
  facultyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  facultyName: {
    fontSize: 14,
    color: '#1a2332',
  },
  facultyCode: {
    fontSize: 12,
    color: '#6b7a8f',
  },
  departmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  departmentName: {
    fontSize: 13,
    color: '#1a2332',
  },
  departmentCode: {
    fontSize: 11,
    color: '#6b7a8f',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Thêm gap cho các nút action (chỉ hoạt động trên React Native mới)
  },
  actionButton: {
    padding: 4,
  },
  
  // Faculty/Department list
  listContainer: {
    marginTop: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#32211a',
    marginBottom: 8,
  },
  
  // Empty state
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTextLarge: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  emptyTextSmall: {
    fontSize: 14,
    color: '#e52929',
    marginTop: 4,
  },
  // a_styles/style_create_std.tsx - Thêm style mới

// Thêm vào cuối file
statusContainer: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 4,
},
statusButton: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: '#ddd',
  backgroundColor: '#f8f9fa',
  gap: 8,
  flex: 1,
  justifyContent: 'center',
},
statusButtonActive: {
  borderColor: '#28a745',
  backgroundColor: '#e8f5e9',
},
statusButtonInactive: {
  borderColor: '#dc3545',
  backgroundColor: '#fde8e8',
},
statusText: {
  fontSize: 14,
  color: '#666',
  fontWeight: '500',
},
statusTextActive: {
  color: '#28a745',
},
statusTextInactive: {
  color: '#dc3545',
},
});