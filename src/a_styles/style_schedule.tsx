// a_styles/style_schedule.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#4A90E2',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
     paddingTop: 50,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF1',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#9AA6B5',
    marginTop: 12,
    fontWeight: '500',
  },
  // Schedule Card
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  courseInfo: {
    flex: 1,
    marginRight: 8,
  },
  courseCode: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 2,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2332',
    marginBottom: 4,
  },
  typeBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    marginLeft: 4,
  },
  scheduleDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F4F8',
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#4A5568',
    marginLeft: 6,
    flexShrink: 1,
  },
  statusRow: {
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  studentCount: {
    fontSize: 12,
    color: '#6B7A8F',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF1',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A2332',
  },
  modalBody: {
    paddingTop: 16,
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A2332',
    marginBottom: 6,
  },
  required: {
    color: '#FF3B30',
  },
  subLabel: {
    fontSize: 12,
    color: '#6B7A8F',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D9E6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A2332',
    backgroundColor: '#FAFBFC',
  },
  rowGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 8,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    padding: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#4A90E2',
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7A8F',
  },
  typeOptionTextActive: {
    color: '#FFFFFF',
  },
  statusToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: 10,
    padding: 4,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: '#4A90E2',
  },
  statusOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7A8F',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F4F8',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerItemSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  pickerItemText: {
    fontSize: 13,
    color: '#4A5568',
  },
  pickerItemTextSelected: {
    color: '#FFFFFF',
  },
  datePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    marginHorizontal: 2,
  },
  dateItemSelected: {
    backgroundColor: '#4A90E2',
  },
  dateItemText: {
    fontSize: 11,
    color: '#6B7A8F',
    fontWeight: '500',
  },
  dateItemNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A2332',
    marginTop: 2,
  },
  dateItemTextSelected: {
    color: '#FFFFFF',
  },
  selectedInfo: {
    fontSize: 13,
    color: '#4A90E2',
    marginTop: 8,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8ECF1',
    marginBottom: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F4F8',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7A8F',
  },
  saveButton: {
    backgroundColor: '#4A90E2',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});