import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';

export default function AudioPlayer({ audioUri }: { audioUri: string }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  async function playSound() {
    if (sound) {
      await sound.unloadAsync(); // Asegura que el audio anterior se detiene
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true }
    );

    setSound(newSound);
    setIsPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
      }
    });
  }

  async function stopSound() {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
    async function playSound() {
        console.log("Intentando reproducir el audio:", audioUri);
      
        if (sound) {
          await sound.unloadAsync(); // Detener cualquier sonido previo
        }
      
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true }
          );
      
          setSound(newSound);
          setIsPlaying(true);
      
          newSound.setOnPlaybackStatusUpdate((status) => {
            console.log("Estado del audio:", status);
            if (status.isLoaded && status.didJustFinish) {
              setIsPlaying(false);
            }
          });
        } catch (error) {
          console.error("Error al cargar el audio:", error);
        }
      }
      
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={isPlaying ? stopSound : playSound}
      >
        <Text style={styles.buttonText}>{isPlaying ? '⏸️ Detener' : '▶️ Reproducir'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#FF385C', // Color de Airbnb
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

