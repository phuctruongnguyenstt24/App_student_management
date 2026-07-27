import { Dimensions, StyleSheet } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },

  filtersContainer: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  filterBox: { flex: 1, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#dcdfe3', marginHorizontal: 4 },
  disabledBox: { backgroundColor: '#eef0f2', opacity: 0.6 },
  filterLabel: { fontSize: 10, color: '#666', fontWeight: 'bold', textTransform: 'uppercase' },
  filterValue: { fontSize: 13, color: '#333', fontWeight: '600', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalItemSelected: { backgroundColor: '#e8f5e9' },
  modalItemText: { fontSize: 15, color: '#333' },
  modalItemTextSelected: { color: '#4CAF50', fontWeight: 'bold' },
  modalCloseBtn: { marginTop: 20, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 8, alignItems: 'center' },
  modalCloseText: { fontSize: 16, fontWeight: '600', color: '#555' },

  studentCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2, alignItems: 'center' },
  nameText: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  subText: { fontSize: 13, color: '#666', marginTop: 2 },
  scoreText: { fontSize: 12, color: '#555', marginTop: 4 },
  btnInput: { flexDirection: 'row', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnInputText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },
  emptyText: { textAlign: 'center', marginTop: 16, color: '#888', fontSize: 14 },

  modalOverlayBs: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContentBs: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#ccc', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalTitleBs: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  studentSubtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 8 },
  courseText: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  scoreInputRow: { flexDirection: 'row', marginBottom: 24 },
  labelBs: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 6 },
  inputBs: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 14, fontSize: 16 },
  btnSaveBs: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnSaveTextBs: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default styles;