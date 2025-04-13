import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface VideoPlayerProps {
  videoUri: string;
}

export default function VideoPlayer({ videoUri }: VideoPlayerProps) {
  const player = useVideoPlayer(videoUri, (player) => {
    player.loop = true; // 🔹 Se configura para que el video se repita automáticamente
    player.play(); // 🔹 El video comienza a reproducirse automáticamente
  });

  return (
    <View style={styles.container}>
      <VideoView 
        player={player} 
        style={styles.video} 
        allowsFullscreen 
        allowsPictureInPicture 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  video: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
});
