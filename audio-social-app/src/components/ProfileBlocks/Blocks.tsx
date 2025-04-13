import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

export interface BlockStyle {
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color?: string;
  backgroundColor?: string;
  padding?: number;
  margin?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
}

// Text Block
export const TextBlock = ({ content, styles = {} }: { content: string, styles?: BlockStyle }) => (
  <Text style={[blockStyles.text, {
    textAlign: styles.textAlign || 'left',
    fontSize: styles.fontSize || 16,
    fontWeight: styles.fontWeight || 'normal',
    color: styles.color || theme.colors.text,
    backgroundColor: styles.backgroundColor,
    padding: styles.padding,
    margin: styles.margin,
  }]}>
    {content}
  </Text>
);

// Image Block
export const ImageBlock = ({ content, styles = {} }: { content: string, styles?: BlockStyle }) => (
  <Image
    source={{ uri: content }}
    style={[blockStyles.image, {
      borderRadius: styles.borderRadius || 8,
      margin: styles.margin,
    }]}
    resizeMode="cover"
  />
);

// Gallery Block
export const GalleryBlock = ({ content, styles = {} }: { content: string[], styles?: BlockStyle }) => (
  <View style={blockStyles.gallery}>
    {content.map((uri, index) => (
      <Image 
        key={index}
        source={{ uri }}
        style={[blockStyles.galleryImage, {
          borderRadius: styles.borderRadius || 8,
        }]}
        resizeMode="cover"
      />
    ))}
  </View>
);

// Video Block
export const VideoBlock = ({ content, styles = {} }: { content: string, styles?: BlockStyle }) => (
  <Video
    source={{ uri: content }}
    style={[blockStyles.video, {
      borderRadius: styles.borderRadius || 8,
      margin: styles.margin,
    }]}
    useNativeControls
    
  />
);

// Link Block
export const LinkBlock = ({ content, styles = {} }: { content: { url: string, title: string }, styles?: BlockStyle }) => (
  <TouchableOpacity 
    style={[blockStyles.link, {
      backgroundColor: styles.backgroundColor || '#f0f2f5',
      borderRadius: styles.borderRadius || 8,
      borderWidth: styles.borderWidth,
      borderColor: styles.borderColor,
      padding: styles.padding || 12,
      margin: styles.margin,
    }]}
    onPress={() => Linking.openURL(content.url)}
  >
    <Ionicons name="link-outline" size={20} color={theme.colors.primary} />
    <Text style={[blockStyles.linkText, {
      color: styles.color || theme.colors.primary,
      fontSize: styles.fontSize || 16,
      fontWeight: styles.fontWeight || 'medium',
    }]}>{content.title || content.url}</Text>
  </TouchableOpacity>
);

// Embed Block (for iframe-like content)
export const EmbedBlock = ({ content, styles = {} }: { content: string, styles?: BlockStyle }) => (
  <View style={[blockStyles.embedContainer, {
    borderRadius: styles.borderRadius || 8,
    margin: styles.margin,
  }]}>
    <WebView
      source={{ html: content }}
      style={blockStyles.embed}
    />
  </View>
);

// Social Media Block
export const SocialBlock = ({ content, styles = {} }: { 
  content: { type: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube', username: string }, 
  styles?: BlockStyle 
}) => {
  const getIcon = () => {
    switch(content.type) {
      case 'instagram': return 'logo-instagram';
      case 'twitter': return 'logo-twitter';
      case 'facebook': return 'logo-facebook';
      case 'tiktok': return 'logo-tiktok';
      case 'linkedin': return 'logo-linkedin';
      case 'youtube': return 'logo-youtube';
      default: return 'logo-instagram';
    }
  };

  const getColor = () => {
    switch(content.type) {
      case 'instagram': return '#E1306C';
      case 'twitter': return '#1DA1F2';
      case 'facebook': return '#4267B2';
      case 'tiktok': return '#000000';
      case 'linkedin': return '#0077B5';
      case 'youtube': return '#FF0000';
      default: return '#E1306C';
    }
  };

  const getUrl = () => {
    switch(content.type) {
      case 'instagram': return `https://instagram.com/${content.username}`;
      case 'twitter': return `https://twitter.com/${content.username}`;
      case 'facebook': return `https://facebook.com/${content.username}`;
      case 'tiktok': return `https://tiktok.com/@${content.username}`;
      case 'linkedin': return `https://linkedin.com/in/${content.username}`;
      case 'youtube': return `https://youtube.com/@${content.username}`;
      default: return '#';
    }
  };

  return (
    <TouchableOpacity 
      style={[blockStyles.socialButton, {
        backgroundColor: styles.backgroundColor || '#f0f2f5',
        borderRadius: styles.borderRadius || 25,
        padding: styles.padding || 12,
        margin: styles.margin,
      }]}
      onPress={() => Linking.openURL(getUrl())}
    >
      <Ionicons name={getIcon()} size={24} color={styles.color || getColor()} />
      <Text style={[blockStyles.socialText, {
        color: styles.color || theme.colors.text,
        fontSize: styles.fontSize || 16,
        fontWeight: styles.fontWeight || 'bold',
      }]}>
        {content.username}
      </Text>
    </TouchableOpacity>
  );
};

// Quote Block
export const QuoteBlock = ({ content, styles = {} }: { content: { text: string, author?: string }, styles?: BlockStyle }) => (
  <View style={[blockStyles.quote, {
    backgroundColor: styles.backgroundColor || '#f9f9f9',
    borderLeftColor: styles.borderColor || theme.colors.primary,
    borderRadius: styles.borderRadius || 4,
    padding: styles.padding || 15,
    margin: styles.margin,
  }]}>
    <Text style={[blockStyles.quoteText, {
      color: styles.color || theme.colors.text,
      fontSize: styles.fontSize || 16,
      fontWeight: styles.fontWeight || 'normal',
      fontStyle: 'italic',
    }]}>"{content.text}"</Text>
    {content.author && (
      <Text style={[blockStyles.quoteAuthor, {
        color: styles.color || '#666',
        fontSize: (styles.fontSize || 16) - 2,
        textAlign: 'right',
      }]}>— {content.author}</Text>
    )}
  </View>
);

// Button Block
export const ButtonBlock = ({ content, styles = {} }: { 
  content: { text: string, url: string }, 
  styles?: BlockStyle 
}) => (
  <TouchableOpacity 
    style={[blockStyles.button, {
      backgroundColor: styles.backgroundColor || theme.colors.primary,
      borderRadius: styles.borderRadius || 8,
      padding: styles.padding || 12,
      margin: styles.margin,
      borderWidth: styles.borderWidth,
      borderColor: styles.borderColor,
    }]}
    onPress={() => Linking.openURL(content.url)}
  >
    <Text style={[blockStyles.buttonText, {
      color: styles.color || '#fff',
      fontSize: styles.fontSize || 16,
      fontWeight: styles.fontWeight || 'bold',
      textAlign: styles.textAlign || 'center',
    }]}>
      {content.text}
    </Text>
  </TouchableOpacity>
);

const blockStyles = StyleSheet.create({
  text: {
    marginVertical: 8,
    lineHeight: 22,
  },
  image: {
    width: '100%',
    height: 200,
    marginVertical: 10,
  },
  gallery: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  galleryImage: {
    width: (width - 40) / 3,
    height: (width - 40) / 3,
    margin: 2,
  },
  video: {
    width: '100%',
    height: 200,
    marginVertical: 10,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  linkText: {
    marginLeft: 8,
  },
  embedContainer: {
    width: '100%',
    height: 250,
    marginVertical: 10,
    overflow: 'hidden',
  },
  embed: {
    flex: 1,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  socialText: {
    marginLeft: 12,
  },
  quote: {
    borderLeftWidth: 4,
    marginVertical: 10,
  },
  quoteText: {
    marginBottom: 5,
  },
  quoteAuthor: {
    marginTop: 5,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  buttonText: {
    textAlign: 'center',
  },
});