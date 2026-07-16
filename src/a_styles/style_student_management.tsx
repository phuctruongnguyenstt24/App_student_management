import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // ==========================================
  // 1. GLOBAL & LAYOUT
  // ==========================================
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  footer: {
    height: 20,
  },

  // ==========================================
  // 2. HEADER
  // ==========================================
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  headerRight: {
    width: 40,
  },

  // ==========================================
  // 3. THỐNG KÊ (STATS CARDS)
  // ==========================================
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  statCardActive: {
    borderLeftWidth: 3,
    borderLeftColor: '#28a745',
  },
  statCardInactive: {
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
  },
  statCardRequest: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF8A4C',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // ==========================================
  // 4. DANH SÁCH & TÌM KIẾM
  // ==========================================
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // ==========================================
  // 5. THẺ SINH VIÊN (STUDENT CARD) - FIXED
  // ==========================================
  studentCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFF',
    padding: 12,
  },
studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Trả về flex-start để canh mép trên
    width: '100%',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Trả về flex-start
    flex: 1, 
    marginRight: 12,
  },
  studentTextContainer: {
    flex: 1, // Rất quan trọng: Bắt buộc text bên trong không được tràn ra ngoài
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0, // Không cho avatar bị méo
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
    flexShrink: 1, 
  },
  studentId: {
    fontSize: 14,
    color: '#666',
    paddingTop: 4,
  },
  studentDept: {
    fontSize: 12,
    color: '#151212',
    paddingTop: 4,
    marginBottom: 4,
    flexShrink: 1,
  },
  statusChip: {
    flexShrink: 0, // QUAN TRỌNG NHẤT: Ép Chip không bao giờ bị bóp méo hay đè lên text
  },
  statusActive: {
    backgroundColor: '#d4edda',
  },
  statusInactive: {
    backgroundColor: '#f8d7da',
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    marginVertical: 4,
  },
  studentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 13,
    color: '#666',
  },
  actionView: {
    backgroundColor: 'transparent',
  },
  actionEdit: {
    backgroundColor: 'transparent',
  },
  actionDelete: {
    backgroundColor: 'transparent',
  },  

  // ==========================================
  // 6. MODAL & DIALOG
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    marginHorizontal: 0,
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFF',
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    alignItems: 'flex-start',
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a2e',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a2e',
    marginTop: 8,
    marginBottom: 4,
  },
  motherTitle: {
    marginTop: 12,
  },
  closeButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
  },

  // --- Edit Dialog Styles ---
  editInput: {
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  statusSelector: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 8,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statusOptionActive: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda',
  },
  statusOptionInactive: {
    borderColor: '#dc3545',
    backgroundColor: '#f8d7da',
  },

  // ==========================================
  // 7. YÊU CẦU (REQUEST CARDS)
  // ==========================================
  requestCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFF',
    padding: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestStudent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  requestId: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  requestPending: {
    backgroundColor: '#fff3cd',
  },
  requestFields: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  requestLabel: {
    fontSize: 13,
    color: '#666',
    width: '100%',
    marginBottom: 4,
  },
  requestFieldTag: {
    backgroundColor: '#e8e8e8',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requestFieldText: {
    fontSize: 12,
    color: '#333',
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  requestReject: {
    borderColor: '#dc3545',
  },
  requestApprove: {
    backgroundColor: '#28a745',
  },

  // ==========================================
  // 8. BỘ LỌC KHOA & LỚP HỌC (NEW)
  // ==========================================
  facultyFilter: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  facultyChip: {
    marginRight: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 20,
  },
  facultyChipSelected: {
    backgroundColor: '#007AFF',
  },
  classCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  classCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classCardText: {
    flexDirection: 'column',
  },
  classNameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  classStudentCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  classHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  backToClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  backToClassText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  selectedClassTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
});