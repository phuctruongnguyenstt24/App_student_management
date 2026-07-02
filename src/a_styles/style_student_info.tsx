import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2f5aa8',
  },

  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '700',
  },

  card: {
    marginTop: 40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 65,
  
  },

  avatarContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: -35,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 50,
    borderWidth:3,
    borderColor: '#fff',
  },

 

  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0d214a',
    textAlign: 'center',
  },

  studentId: {
    textAlign: 'center',
    color: '#6d7c99',
    marginTop: 6,
    marginBottom: 20,
    fontSize: 15,
  },

  infoContainer: {
    marginTop: 10,
    
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },

  label: {
    color: '#0f1218',
    fontSize: 16,
  },

  value: {
    color: '#102b5d',
    fontWeight: '700',
    fontSize: 16,
    maxWidth: '55%',
    textAlign: 'right',
  },
});