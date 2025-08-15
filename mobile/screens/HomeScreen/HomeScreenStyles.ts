import { StyleSheet } from 'react-native';
import { colors } from '../../themes/tokens' 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'background',
  },
  title: {
    fontSize: 24,
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    marginBottom: 15,
  },
});

export default styles;