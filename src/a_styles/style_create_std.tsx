// a_styles/style_create_std.tsx
import { StyleSheet } from 'react-native';

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
    paddingTop: 12,
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
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  
  // Picker
  pickerContainer: {
    marginBottom: 12,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a2332',
    marginBottom: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  
  // Error & Success
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
  
  // Button
  createButton: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
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
    gap: 12,
  },
  modalCancel: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d8e0',
  },
  modalSave: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#4A90E2',
  },
});