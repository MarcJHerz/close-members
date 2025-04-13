import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../../MainNavigator'; // Asegúrate de que está bien referenciado

export default function RegisterScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const auth = useContext(AuthContext);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    username: '',
    email: '',
    password: ''
  });

  const validateForm = () => {
    const newErrors = {
      name: '',
      username: '',
      email: '',
      password: ''
    };

    if (!name) newErrors.name = 'El nombre es obligatorio';
    if (!username) newErrors.username = 'El nombre de usuario es obligatorio';
    if (!email) newErrors.email = 'El email es obligatorio';
    if (!password) newErrors.password = 'La contraseña es obligatoria';
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (password && password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleRegister = async () => {
    if (!auth) return;
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await auth.register(name, username, email, password);
      Alert.alert('Registro exitoso', 'Tu cuenta ha sido creada.');
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Ocurrió un error en el registro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrarse</Text>
      
      <TextInput
        style={[styles.input, errors.name ? styles.inputError : null]}
        placeholder="Nombre"
        value={name}
        onChangeText={setName}
      />
      {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
      
      <TextInput
        style={[styles.input, errors.username ? styles.inputError : null]}
        placeholder="Nombre de usuario"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}
      
      <TextInput
        style={[styles.input, errors.email ? styles.inputError : null]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
      
      <TextInput
        style={[styles.input, errors.password ? styles.inputError : null]}
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Registrarse" onPress={handleRegister} />
      )}
      
      <Button
        title="¿Ya tienes cuenta? Inicia sesión"
        onPress={() => navigation.navigate('Login')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20 
  },
  input: { 
    width: '100%', 
    height: 40, 
    borderBottomWidth: 1, 
    marginBottom: 10, 
    paddingHorizontal: 10 
  },
  inputError: {
    borderBottomColor: 'red'
  },
  errorText: {
    color: 'red',
    alignSelf: 'flex-start',
    marginBottom: 10
  }
});
//prueba de cambios
