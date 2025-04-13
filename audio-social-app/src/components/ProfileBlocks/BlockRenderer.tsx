import React from 'react';
import { View, Text } from 'react-native';
import {
  TextBlock, ImageBlock, GalleryBlock, VideoBlock,
  LinkBlock, EmbedBlock, SocialBlock, QuoteBlock, ButtonBlock
} from './Blocks';

export type BlockType = 
  | { type: 'text', content: string, styles?: any, position: number }
  | { type: 'image', content: string, styles?: any, position: number }
  | { type: 'gallery', content: string[], styles?: any, position: number }
  | { type: 'video', content: string, styles?: any, position: number }
  | { type: 'link', content: { url: string, title: string }, styles?: any, position: number }
  | { type: 'embed', content: string, styles?: any, position: number }
  | { type: 'social', content: { type: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'linkedin' | 'youtube', username: string }, styles?: any, position: number }
  | { type: 'quote', content: { text: string, author?: string }, styles?: any, position: number }
  | { type: 'button', content: { text: string, url: string }, styles?: any, position: number };

interface BlockRendererProps {
  blocks: BlockType[];
}

const BlockRenderer: React.FC<BlockRendererProps> = ({ blocks }) => {
  // Sort blocks by position
  const sortedBlocks = [...blocks].sort((a, b) => a.position - b.position);

  return (
    <View>
      {sortedBlocks.map((block, index) => {
        switch (block.type) {
          case 'text':
            return (
              <Text
                key={index}
                style={[
                  block.styles?.fontWeight === 'bold' && { fontWeight: 'bold' },
                  block.styles?.textAlign && { textAlign: block.styles.textAlign },
                  block.styles?.fontSize && { fontSize: block.styles.fontSize },
                ]}
              >
                {block.content}
              </Text>
            );
          case 'image':
            return <ImageBlock key={index} content={block.content} styles={block.styles} />;
          case 'gallery':
            return <GalleryBlock key={index} content={block.content} styles={block.styles} />;
          case 'video':
            return <VideoBlock key={index} content={block.content} styles={block.styles} />;
          case 'link':
            return <LinkBlock key={index} content={block.content} styles={block.styles} />;
          case 'embed':
            return <EmbedBlock key={index} content={block.content} styles={block.styles} />;
          case 'social':
            return <SocialBlock key={index} content={block.content} styles={block.styles} />;
          case 'quote':
            return <QuoteBlock key={index} content={block.content} styles={block.styles} />;
          case 'button':
            return <ButtonBlock key={index} content={block.content} styles={block.styles} />;
          default:
            return <Text key={index}>Bloque no reconocido</Text>;
        }
      })}
    </View>
  );
};

export default BlockRenderer;