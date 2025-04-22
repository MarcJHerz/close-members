export interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  profilePicture?: string;
  bannerImage?: string;
  bio?: string;
  category?: string;
  links?: string[];
  subscriptionPrice?: number;
  profileBlocks?: Array<{
    type: 'text' | 'image' | 'gallery' | 'video' | 'link' | 'embed' | 'social' | 'quote' | 'button';
    content: any;
    position?: number;
    styles?: Record<string, any>;
  }>;
  createdAt?: Date;
  lastLogin?: Date;
  token?: string;
} 