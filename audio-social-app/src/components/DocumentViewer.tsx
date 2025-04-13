import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';

interface DocumentViewerProps {
  docUri: string;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ docUri }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [docType, setDocType] = useState<'pdf' | 'text' | 'unknown'>('unknown');
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    if (docUri.endsWith('.pdf')) {
      setDocType('pdf');
    } else if (docUri.endsWith('.txt') || docUri.endsWith('.md')) {
      setDocType('text');
      fetch(docUri)
        .then((response) => response.text())
        .then((text) => {
          setContent(text);
          setIsLoading(false);
        })
        .catch(() => {
          setContent('Error al cargar el documento.');
          setIsLoading(false);
        });
    } else {
      setDocType('unknown');
    }
  }, [docUri]);

  if (isLoading && docType !== 'text') {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (docType === 'pdf') {
    return <WebView source={{ uri: docUri }} style={styles.webview} />;
  }

  if (docType === 'text') {
    return (
      <ScrollView style={styles.textContainer}>
        <Text style={styles.text}>{content}</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>No se puede mostrar este tipo de documento.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webview: {
    flex: 1,
    height: 400, // Ajusta esto según sea necesario
  },
  textContainer: {
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});

export default DocumentViewer;
