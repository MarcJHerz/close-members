import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ImageViewerComponentProps {
  imageUri: string;
}

const ImageViewerComponent: React.FC<ImageViewerComponentProps> = ({ imageUri }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // 🔹 Zoom con gesto de pellizco
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      scale.value = withSpring(1);
    });

  // 🔹 Movimiento al hacer zoom
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      }
    })
    .onEnd(() => {
      translateX.value = withTiming(0);
      translateY.value = withTiming(0);
    });

  // 🔹 Doble toque para hacer zoom como Instagram
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = scale.value > 1 ? withSpring(1) : withSpring(2);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureHandlerRootView>
      <GestureDetector gesture={Gesture.Exclusive(doubleTapGesture, pinchGesture, panGesture)}>
        <Animated.Image source={{ uri: imageUri }} style={[styles.image, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  image: {
    width: width,
    height: 250,
    resizeMode: 'cover',
    borderRadius: 10,
  },
});

export default ImageViewerComponent;
