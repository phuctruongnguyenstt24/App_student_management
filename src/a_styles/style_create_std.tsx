import { StyleSheet } from "react-native";

export const styles = StyleSheet.create ({


     
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    card: {
        margin: 12,
        borderRadius: 12,
    },
    input: {
        marginBottom: 12,
    },
    inputError: {
        borderColor: '#dc3545',
        backgroundColor: '#fff5f5',
    },
    errorText: {
        color: '#dc3545',
        fontSize: 12,
        marginTop: -8,
        marginBottom: 8,
    },
    successText: {
        color: '#28a745',
        fontSize: 12,
        marginTop: -8,
        marginBottom: 8,
    },
    pickerContainer: {
        marginBottom: 8,
    },
    pickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickerWrapper: {
        flex: 1,
    },
    pickerList: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 4,
    },
    createButton: {
        marginTop: 8,
        paddingVertical: 6,
        backgroundColor: '#007AFF',
    },
    facultyItem: {
        marginBottom: 12,
    },
    facultyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    facultyInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    facultyName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    codeChip: {
        backgroundColor: '#e3f2fd',
    },
    departmentList: {
        marginLeft: 16,
        marginTop: 4,
    },
    departmentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 2,
    },
    departmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    departmentName: {
        fontSize: 14,
        color: '#555',
    },
    smallChip: {
        backgroundColor: '#f3e5f5',
        height: 24,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    divider: {
        marginVertical: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalInput: {
        marginBottom: 12,
    },
    modalPicker: {
        marginBottom: 12,
    },
    modalPickerLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    modalCancel: {
        flex: 1,
        marginRight: 8,
    },
    modalSave: {
        flex: 1,
        marginLeft: 8,
        backgroundColor: '#007AFF',
    }

}


)