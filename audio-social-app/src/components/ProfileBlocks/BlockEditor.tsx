import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { BlockType } from './BlockRenderer';
import { theme } from '../../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { KeyboardAvoidingView, Platform } from 'react-native';

interface BlockEditorProps {
  initialBlocks: BlockType[];
  onSave: (blocks: BlockType[]) => void;
  loading: boolean;
}

// Separate component for text editing with styling support
const TextBlockEditor = ({
  initialContent,
  initialStyles = {},
  onSave,
  onCancel
}: {
  initialContent: string;
  initialStyles?: any;
  onSave: (text: string, styles: any) => void;
  onCancel: () => void;
}) => {
  const [text, setText] = useState(initialContent);
  const [styles, setStyles] = useState(initialStyles || {});
  
  const toggleStyle = (styleName: string, value: any, currentValue: any) => {
    setStyles({
      ...styles,
      [styleName]: currentValue === value ? undefined : value
    });
  };
  
  return (
    <View style={editorStyles.blockEditor}>
      <Text style={editorStyles.editorLabel}>Texto</Text>
      <TextInput
        style={[
          editorStyles.textInput,
          styles.fontWeight === 'bold' && { fontWeight: 'bold' },
          styles.textAlign && { textAlign: styles.textAlign },
          styles.fontSize && { fontSize: styles.fontSize }
        ]}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Escribe tu texto aquí..."
        autoFocus
        textAlignVertical="top"
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
      />
      
      <View style={editorStyles.styleControls}>
        <TouchableOpacity
          style={[editorStyles.styleButton, (styles.fontWeight === 'bold' && editorStyles.activeStyleButton)]}
          onPress={() => toggleStyle('fontWeight', 'bold', styles.fontWeight)}
        >
          <Text style={{ 
            fontWeight: 'bold', 
            fontSize: 18, 
            color: (styles.fontWeight === 'bold') ? '#fff' : '#333' 
          }}>B</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[editorStyles.styleButton, (styles.textAlign === 'center' && editorStyles.activeStyleButton)]}
          onPress={() => toggleStyle('textAlign', 'center', styles.textAlign)}
        >
          <Text style={{ 
            fontSize: 18, 
            color: (styles.textAlign === 'center') ? '#fff' : '#333' 
          }}>⚌</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[editorStyles.styleButton, (styles.fontSize === 20 && editorStyles.activeStyleButton)]}
          onPress={() => toggleStyle('fontSize', 20, styles.fontSize)}
        >
          <Ionicons name="text" size={18} color={(styles.fontSize === 20) ? '#fff' : '#333'} />
        </TouchableOpacity>
      </View>
      
      <View style={editorStyles.buttonRow}>
        <TouchableOpacity style={editorStyles.cancelButton} onPress={onCancel}>
          <Text style={editorStyles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={editorStyles.doneButton} 
          onPress={() => onSave(text, styles)}
        >
          <Text style={editorStyles.doneButtonText}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const API_URL = 'http://192.168.1.87:5000';

const BlockEditor: React.FC<BlockEditorProps> = ({
  initialBlocks = [],
  onSave,
  loading
}) => {
  const [blocks, setBlocks] = useState<BlockType[]>(initialBlocks);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [temporaryLoading, setTemporaryLoading] = useState(false);
  const [editingTextBlock, setEditingTextBlock] = useState<{index: number, content: string, styles: any} | null>(null);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  // Function to upload image to server
  const uploadImageToServer = async (uri: string): Promise<string> => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return uri;
    
    // Create form data for the image
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : 'jpg';
    
    formData.append('image', {
      uri,
      name: `image_${Date.now()}.${ext}`,
      type: `image/${ext}`,
    } as any);
    
    try {
      console.log('📤 Uploading image to server...');
      const response = await axios.post(
        `${API_URL}/api/users/profile/upload-image`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data && response.data.url) {
        console.log('📷 Server image URL:', response.data.url);
        return response.data.url;
      }
      
      console.log('⚠️ No URL found in response:', response.data);
      return uri;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      return uri;
    }
  };

  const addBlock = (type: BlockType['type']) => {
    if (type === 'text') {
      const newBlockIndex = blocks.length;
      const newBlock: BlockType = { 
        type: 'text', 
        content: '', 
        position: newBlockIndex, 
        styles: {} 
      };
      
      const newBlocks = [...blocks, newBlock];
      setBlocks(newBlocks);
      
      // Start editing the new text block
      setTimeout(() => {
        setEditingTextBlock({
          index: newBlockIndex,
          content: '',
          styles: {}
        });
      }, 100);
      return;
    }
    
    if (type === 'image') {
      pickImage();
      return;
    }

    let newBlock: BlockType;
    
    switch (type) {
      case 'gallery':
        newBlock = { type, content: [], position: blocks.length, styles: {} };
        break;
      case 'video':
        newBlock = { type, content: '', position: blocks.length, styles: {} };
        break;
      case 'link':
        newBlock = { type, content: { url: '', title: 'Título del enlace' }, position: blocks.length, styles: {} };
        break;
      case 'embed':
        newBlock = { type, content: '<p>Código embed aquí</p>', position: blocks.length, styles: {} };
        break;
      case 'social':
        newBlock = { 
          type, 
          content: { type: 'instagram', username: 'tu_usuario' }, 
          position: blocks.length, 
          styles: {} 
        };
        break;
      case 'quote':
        newBlock = { 
          type, 
          content: { text: 'Tu cita aquí', author: 'Autor' }, 
          position: blocks.length, 
          styles: {} 
        };
        break;
      case 'button':
        newBlock = { 
          type, 
          content: { text: 'Botón', url: 'https://' }, 
          position: blocks.length, 
          styles: {} 
        };
        break;
      default:
        return;
    }

    setBlocks([...blocks, newBlock]);
    setEditingBlockIndex(blocks.length);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setTemporaryLoading(true);
        
        try {
          // Upload image to server first to get a proper URL
          const serverUrl = await uploadImageToServer(result.assets[0].uri);
          
          const newBlock: BlockType = {
            type: 'image',
            content: serverUrl,
            position: blocks.length,
            styles: {}
          };
          
          setBlocks([...blocks, newBlock]);
        } catch (error) {
          console.error('❌ Error processing image:', error);
          Alert.alert('Error', 'No se pudo procesar la imagen seleccionada');
        } finally {
          setTemporaryLoading(false);
        }
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert('Error', 'No se pudo abrir la galería de imágenes');
    }
  };

  const deleteBlock = (index: number) => {
    Alert.alert(
      "Eliminar bloque",
      "¿Estás seguro de que quieres eliminar este bloque?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            const newBlocks = [...blocks];
            newBlocks.splice(index, 1);
            // Update positions
            newBlocks.forEach((block, idx) => {
              block.position = idx;
            });
            setBlocks(newBlocks);
            setEditingBlockIndex(null);
          }
        }
      ]
    );
  };

  const updateBlock = (index: number, updatedBlock: Partial<BlockType>) => {
    if (index === undefined || index === null) {
      console.warn('Invalid index in updateBlock:', index);
      return;
    }
    
    const newBlocks = [...blocks];
    if (index >= 0 && index < newBlocks.length) {
      newBlocks[index] = { ...newBlocks[index], ...updatedBlock } as BlockType;
      setBlocks(newBlocks);
    }
  };
  
  // Special handler for saving text blocks with styling
  const saveTextBlock = (index: number, text: string, styles: any) => {
    console.log(`Saving text block at index ${index}:`, text, styles);
    
    const newBlocks = [...blocks];
    if (index >= 0 && index < newBlocks.length) {
      newBlocks[index] = { 
        ...newBlocks[index], 
        content: text,
        styles: styles
      } as BlockType;
      setBlocks(newBlocks);
    }
    setEditingTextBlock(null);
  };

  const renderBlockEditor = (block: BlockType, index: number) => {
    // Special case for text editing
    if (editingTextBlock && editingTextBlock.index === index) {
      return (
        <TextBlockEditor
          initialContent={block.content as string}
          initialStyles={block.styles}
          onSave={(text, styles) => saveTextBlock(index, text, styles)}
          onCancel={() => setEditingTextBlock(null)}
        />
      );
    }
    
    const isEditing = editingBlockIndex === index;

    if (!isEditing) {
      return (
        <TouchableOpacity
          style={editorStyles.blockPreview}
          onPress={() => {
            if (block.type === 'text') {
              setEditingTextBlock({
                index, 
                content: block.content as string, 
                styles: block.styles || {}
              });
            } else {
              setEditingBlockIndex(index);
            }
          }}
        >
          <View style={editorStyles.blockHeader}>
            <Text style={editorStyles.blockType}>{block.type.toUpperCase()}</Text>
            <TouchableOpacity onPress={() => deleteBlock(index)}>
              <Ionicons name="trash-outline" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
          
          {block.type === 'text' ? (
            <Text style={[
              editorStyles.blockPreviewText,
              block.styles?.fontWeight === 'bold' && { fontWeight: 'bold' },
              block.styles?.textAlign && { textAlign: block.styles.textAlign },
              block.styles?.fontSize && { fontSize: block.styles.fontSize }
            ]}>
              {(block.content as string) || 'Click para editar'}
            </Text>
          ) : (
            <Text style={editorStyles.blockPreviewText}>
              {block.type === 'image' ? 'Imagen' :
              block.type === 'gallery' ? 'Galería de imágenes' :
              block.type === 'video' ? 'Video' :
              block.type === 'link' ? (block.content as any).title || (block.content as any).url :
              block.type === 'embed' ? 'Contenido embebido' :
              block.type === 'social' ? `${(block.content as any).type}: ${(block.content as any).username}` :
              block.type === 'quote' ? `"${(block.content as any).text}" — ${(block.content as any).author || 'Anónimo'}` :
              block.type === 'button' ? (block.content as any).text : 'Bloque'}
            </Text>
          )}
          
          {block.type === 'image' && (
            <Image source={{ uri: block.content as string }} style={editorStyles.previewImage} />
          )}
        </TouchableOpacity>
      );
    }

    // Different editor for each block type (except text, which is handled separately)
    switch (block.type) {      
      case 'link':
        const linkContent = block.content as { url: string, title: string };
        return (
          <View style={editorStyles.blockEditor}>
            <Text style={editorStyles.editorLabel}>Enlace</Text>
            <TextInput
              style={editorStyles.textInput}
              value={linkContent.title}
              onChangeText={(text) => updateBlock(index, { 
                content: { ...linkContent, title: text }
              })}
              placeholder="Título del enlace"
              autoComplete="off"
            />
            <TextInput
              style={editorStyles.textInput}
              value={linkContent.url}
              onChangeText={(text) => updateBlock(index, { 
                content: { ...linkContent, url: text }
              })}
              placeholder="URL (https://...)"
              keyboardType="url"
              autoComplete="off"
            />
            <TouchableOpacity style={editorStyles.doneButton} onPress={() => setEditingBlockIndex(null)}>
              <Text style={editorStyles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        );

      case 'social':
        const socialContent = block.content as { type: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube', username: string };
        return (
          <View style={editorStyles.blockEditor}>
            <Text style={editorStyles.editorLabel}>Red Social</Text>
            <View style={editorStyles.row}>
              <Text style={editorStyles.rowLabel}>Plataforma:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={editorStyles.socialTypes}>
                {['instagram', 'twitter', 'facebook', 'tiktok', 'linkedin', 'youtube'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[editorStyles.socialTypeButton, socialContent.type === type && editorStyles.activeSocialType]}
                    onPress={() => updateBlock(index, { 
                      content: { ...socialContent, type: type as any }
                    })}
                  >
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: 'bold',
                      color: socialContent.type === type ? '#fff' : '#333' 
                    }}>
                      {type.toUpperCase().slice(0, 2)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TextInput
              style={editorStyles.textInput}
              value={socialContent.username}
              onChangeText={(text) => updateBlock(index, { 
                content: { ...socialContent, username: text }
              })}
              placeholder="Nombre de usuario"
              autoComplete="off"
            />
            <TouchableOpacity style={editorStyles.doneButton} onPress={() => setEditingBlockIndex(null)}>
              <Text style={editorStyles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        );

      case 'quote':
        const quoteContent = block.content as { text: string, author?: string };
        return (
          <View style={editorStyles.blockEditor}>
            <Text style={editorStyles.editorLabel}>Cita</Text>
            <TextInput
              style={editorStyles.textInput}
              multiline
              value={quoteContent.text}
              onChangeText={(text) => updateBlock(index, { 
                content: { ...quoteContent, text }
              })}
              placeholder="Texto de la cita"
              autoComplete="off"
            />
            <TextInput
              style={editorStyles.textInput}
              value={quoteContent.author || ''}
              onChangeText={(text) => updateBlock(index, { 
                content: { ...quoteContent, author: text }
              })}
              placeholder="Autor (opcional)"
              autoComplete="off"
            />
            <TouchableOpacity style={editorStyles.doneButton} onPress={() => setEditingBlockIndex(null)}>
              <Text style={editorStyles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        );

      case 'button':
        const buttonContent = block.content as { text: string, url: string };
        return (
          <View style={editorStyles.blockEditor}>
            <Text style={editorStyles.editorLabel}>Botón</Text>
            <TextInput
              style={editorStyles.textInput}
              value={buttonContent.text}
              onChangeText={(text) => updateBlock(index, { 
                content: { ...buttonContent, text }
              })}
              placeholder="Texto del botón"
              autoComplete="off"
            />
            <TextInput
              style={editorStyles.textInput}
              value={buttonContent.url}
              onChangeText={(text) => updateBlock(index, { 
                content: { ...buttonContent, url: text }
              })}
              placeholder="URL (https://...)"
              keyboardType="url"
              autoComplete="off"
            />
            <View style={editorStyles.styleControls}>
              <TouchableOpacity
                style={[editorStyles.colorButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => updateBlock(index, { 
                  styles: { ...block.styles, backgroundColor: theme.colors.primary, color: '#fff' }
                })}
              />
              <TouchableOpacity
                style={[editorStyles.colorButton, { backgroundColor: '#4caf50' }]}
                onPress={() => updateBlock(index, { 
                  styles: { ...block.styles, backgroundColor: '#4caf50', color: '#fff' }
                })}
              />
              <TouchableOpacity
                style={[editorStyles.colorButton, { backgroundColor: '#f44336' }]}
                onPress={() => updateBlock(index, { 
                  styles: { ...block.styles, backgroundColor: '#f44336', color: '#fff' }
                })}
              />
              <TouchableOpacity
                style={[editorStyles.colorButton, { backgroundColor: '#ff9800' }]}
                onPress={() => updateBlock(index, { 
                  styles: { ...block.styles, backgroundColor: '#ff9800', color: '#fff' }
                })}
              />
            </View>
            <TouchableOpacity style={editorStyles.doneButton} onPress={() => setEditingBlockIndex(null)}>
              <Text style={editorStyles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        );

      // Text case is handled separately with editingTextBlock state
      case 'text':
        // This should not happen, but just in case:
        setEditingTextBlock({
          index, 
          content: block.content as string,
          styles: block.styles || {}
        });
        return null;
        
      default:
        return (
          <View style={editorStyles.blockEditor}>
            <Text style={editorStyles.editorLabel}>{block.type}</Text>
            <Text style={editorStyles.editorHelp}>Este tipo de bloque no tiene editor personalizado todavía.</Text>
            <TouchableOpacity style={editorStyles.doneButton} onPress={() => setEditingBlockIndex(null)}>
              <Text style={editorStyles.doneButtonText}>Listo</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  const renderItem = ({ item, drag, isActive, index }: any) => {
    // If this item is being edited as text, don't render it in the list
    if (editingTextBlock && editingTextBlock.index === index) {
      return (
        <View style={editorStyles.textEditorContainer}>
          <TextBlockEditor
            initialContent={editingTextBlock.content}
            initialStyles={editingTextBlock.styles}
            onSave={(text, styles) => saveTextBlock(index, text, styles)}
            onCancel={() => setEditingTextBlock(null)}
          />
        </View>
      );
    }
    
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive || editingBlockIndex === index}
          style={[editorStyles.dragItem, isActive && editorStyles.dragActive]}
        >
          {renderBlockEditor(item, index)}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const saveBlocks = () => {
    onSave(blocks);
  };

  const renderBottom = () => (
    <View>
      <View style={editorStyles.addBlockSection}>
        <Text style={editorStyles.addBlockTitle}>Añadir bloque</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={editorStyles.blockTypeScroll}>
          <TouchableOpacity style={editorStyles.blockTypeButton} onPress={() => addBlock('text')}>
            <Ionicons name="text-outline" size={24} color="#333" />
            <Text style={editorStyles.blockTypeText}>Texto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={editorStyles.blockTypeButton} onPress={() => addBlock('image')}>
            <Ionicons name="image-outline" size={24} color="#333" />
            <Text style={editorStyles.blockTypeText}>Imagen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={editorStyles.blockTypeButton} onPress={() => addBlock('link')}>
            <Ionicons name="link-outline" size={24} color="#333" />
            <Text style={editorStyles.blockTypeText}>Enlace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={editorStyles.blockTypeButton} onPress={() => addBlock('social')}>
            <Ionicons name="logo-instagram" size={24} color="#333" />
            <Text style={editorStyles.blockTypeText}>Social</Text>
          </TouchableOpacity>
          <TouchableOpacity style={editorStyles.blockTypeButton} onPress={() => addBlock('quote')}>
            <Ionicons name="chatbox-ellipses-outline" size={24} color="#333" />
            <Text style={editorStyles.blockTypeText}>Cita</Text>
          </TouchableOpacity>
          <TouchableOpacity style={editorStyles.blockTypeButton} onPress={() => addBlock('button')}>
            <Ionicons name="arrow-forward-circle-outline" size={24} color="#333" />
            <Text style={editorStyles.blockTypeText}>Botón</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <TouchableOpacity 
        style={[editorStyles.saveButton, (loading || temporaryLoading) && editorStyles.disabledButton]} 
        onPress={saveBlocks}
        disabled={loading || temporaryLoading || editingTextBlock !== null}
      >
        {loading || temporaryLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={editorStyles.saveButtonText}>Guardar Perfil</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={editorStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <Text style={editorStyles.title}>Constructor de Perfil</Text>
      <Text style={editorStyles.subtitle}>Arrastra para reordenar. Toca para editar.</Text>

      {blocks.length === 0 ? (
        <View style={{flex: 1}}>
          <View style={editorStyles.emptyBlocksMessage}>
            <Ionicons name="cube-outline" size={60} color="#ddd" />
            <Text style={editorStyles.emptyTitle}>No hay bloques todavía</Text>
            <Text style={editorStyles.emptySubtitle}>Añade un bloque para comenzar a diseñar tu perfil</Text>
          </View>
          {renderBottom()}
        </View>
      ) : (
        <View style={{flex: 1}}>
          <DraggableFlatList
            data={blocks}
            renderItem={renderItem}
            keyExtractor={(item, index) => `block-${index}`}
            onDragEnd={({ data }) => {
              const reorderedBlocks = data.map((block, idx) => ({
                ...block,
                position: idx
              })) as BlockType[];
              setBlocks(reorderedBlocks);
            }}
            contentContainerStyle={editorStyles.listContent}
            ListFooterComponent={renderBottom}
          />
        </View>
      )}

      {temporaryLoading && (
        <View style={editorStyles.overlayLoading}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={editorStyles.loadingText}>Subiendo imagen...</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const editorStyles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
  },
  dragItem: {
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  dragActive: {
    backgroundColor: '#f0f0f0',
    opacity: 0.8,
  },
  blockPreview: {
    padding: 12,
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  blockType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  blockPreviewText: {
    color: '#333',
    lineHeight: 22,
  },
  previewImage: {
    height: 100,
    borderRadius: 4,
    marginTop: 10,
  },
  blockEditor: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  editorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  editorHelp: {
    color: '#666',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    minHeight: 100,
    fontSize: 16,
  },
  doneButton: {
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
    flex: 1,
    marginLeft: 8,
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  styleControls: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  styleButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  activeStyleButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rowLabel: {
    width: 100,
    fontSize: 14,
    color: '#333',
  },
  socialTypes: {
    flexDirection: 'row',
  },
  socialTypeButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginRight: 8,
  },
  activeSocialType: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  colorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  addBlockSection: {
    marginVertical: 15,
  },
  addBlockTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  blockTypeScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  blockTypeButton: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  blockTypeText: {
    fontSize: 12,
    marginTop: 5,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.7,
  },
  emptyBlocksMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    flex: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#999',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 5,
  },
  overlayLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.primary,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  textEditorContainer: {
    marginBottom: 10,
    marginTop: 10,
  },
});

export default BlockEditor;