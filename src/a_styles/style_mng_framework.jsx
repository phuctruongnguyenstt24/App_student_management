import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "#4CAF50",
    padding: 16,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  semesterCard: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  subjectCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  subjectCode: {
    fontSize: 13,
    color: "#546e7a",
    fontWeight: "500",
  },

  syncIcon: {
    marginLeft: 4,
  },

  subjectActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  // Button
  buttonRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  halfButton: {
    flex: 1,
  },
  syncButton: {
    backgroundColor: "#e3f2fd",
    borderColor: "#90caf9",
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },

  syncAllButton: {
    backgroundColor: "rgba(33, 150, 243, 0.8)",
  },
  syncButtonText: {
    color: "#1565c0",
  },

  semesterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 12,
    marginBottom: 12,
  },
  semesterHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  semesterTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  semesterStats: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsText: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "500",
  },
  editSemesterButton: {
    padding: 4,
  },
  deleteSemesterButton: {
    padding: 4,
  },
  subjectCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  subjectTitle: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  subjectCode: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  subjectActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completed: {
    backgroundColor: "#4CAF50",
  },
  incomplete: {
    backgroundColor: "#ff9800",
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  subjectDetails: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  detailValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  requiredText: {
    color: "#4CAF50",
  },
  electiveText: {
    color: "#2196F3",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addButtonText: {
    color: "#4CAF50",
    fontSize: 14,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: "row",
    gap: 12,
  },
  modalInputHalf: {
    flex: 1,
  },
  typeSelector: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginBottom: 12,
  },
  typeSelectorActive: {
    backgroundColor: "#e8f5e9",
    borderColor: "#4CAF50",
  },
  typeSelectorText: {
    fontSize: 14,
    color: "#666",
  },
  typeSelectorTextActive: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  addSemesterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  addSemesterText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },

  backButton: {
    padding: 4,
  },
  // Thêm vào cuối file styles
  syncBadge: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 12,
  },
  subjectDepartment: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
});
