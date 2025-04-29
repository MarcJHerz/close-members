export type Community = {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  members: string[];
  creator: { _id: string; name: string; profilePicture?: string };
};

export interface User {
  id: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
}

export interface Post {
  id: string;
  userId: string;
  audioUrl: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
  user: User;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow';
  postId?: string;
  commentId?: string;
  createdAt: string;
  read: boolean;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface AppState {
  posts: Post[];
  comments: Comment[];
  notifications: Notification[];
  loading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
  app: AppState;
} 