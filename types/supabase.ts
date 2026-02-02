export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ChannelStatus = 'want' | 'watching' | 'watched';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          is_public: boolean;
          email_notifications: boolean;
          preferences: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          is_public?: boolean;
          email_notifications?: boolean;
          preferences?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          is_public?: boolean;
          email_notifications?: boolean;
          preferences?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_settings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_follows: {
        Row: {
          follower_id: string;
          followee_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          followee_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          followee_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_follows_follower_id_fkey';
            columns: ['follower_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_follows_followee_id_fkey';
            columns: ['followee_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      channels: {
        Row: {
          id: string;
          youtube_channel_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          banner_url: string | null;
          subscriber_count: number | null;
          video_count: number | null;
          published_at: string | null;
          latest_video_at: string | null;
          category: string | null;
          tags: Json;
          metadata: Json;
          cache_updated_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          youtube_channel_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          banner_url?: string | null;
          subscriber_count?: number | null;
          video_count?: number | null;
          published_at?: string | null;
          latest_video_at?: string | null;
          category?: string | null;
          tags?: Json;
          metadata?: Json;
          cache_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          youtube_channel_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          banner_url?: string | null;
          subscriber_count?: number | null;
          video_count?: number | null;
          published_at?: string | null;
          latest_video_at?: string | null;
          category?: string | null;
          tags?: Json;
          metadata?: Json;
          cache_updated_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      top_videos: {
        Row: {
          id: string;
          channel_id: string;
          youtube_video_id: string;
          title: string;
          thumbnail_url: string | null;
          view_count: number;
          rank: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          youtube_video_id: string;
          title: string;
          thumbnail_url?: string | null;
          view_count?: number;
          rank: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          youtube_video_id?: string;
          title?: string;
          thumbnail_url?: string | null;
          view_count?: number;
          rank?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'top_videos_channel_id_fkey';
            columns: ['channel_id'];
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          channel_id: string;
          rating: number;
          title: string | null;
          content: string;
          is_spoiler: boolean;
          helpful_count: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel_id: string;
          rating: number;
          title?: string | null;
          content: string;
          is_spoiler?: boolean;
          helpful_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_id?: string;
          rating?: number;
          title?: string | null;
          content?: string;
          is_spoiler?: boolean;
          helpful_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_channel_id_fkey';
            columns: ['channel_id'];
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
        ];
      };
      review_helpful: {
        Row: {
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          review_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          review_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'review_helpful_review_id_fkey';
            columns: ['review_id'];
            referencedRelation: 'reviews';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'review_helpful_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_channels: {
        Row: {
          id: string;
          user_id: string;
          channel_id: string;
          status: ChannelStatus;
          started_at: string | null;
          finished_at: string | null;
          private_memo: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          channel_id: string;
          status: ChannelStatus;
          started_at?: string | null;
          finished_at?: string | null;
          private_memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          channel_id?: string;
          status?: ChannelStatus;
          started_at?: string | null;
          finished_at?: string | null;
          private_memo?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_channels_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_channels_channel_id_fkey';
            columns: ['channel_id'];
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
        ];
      };
      lists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          is_public: boolean;
          slug: string | null;
          view_count: number;
          like_count: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          is_public?: boolean;
          slug?: string | null;
          view_count?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          is_public?: boolean;
          slug?: string | null;
          view_count?: number;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'lists_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      list_channels: {
        Row: {
          id: string;
          list_id: string;
          channel_id: string;
          order_index: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          channel_id: string;
          order_index: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          channel_id?: string;
          order_index?: number;
          comment?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'list_channels_list_id_fkey';
            columns: ['list_id'];
            referencedRelation: 'lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'list_channels_channel_id_fkey';
            columns: ['channel_id'];
            referencedRelation: 'channels';
            referencedColumns: ['id'];
          },
        ];
      };
      list_likes: {
        Row: {
          list_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          list_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          list_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'list_likes_list_id_fkey';
            columns: ['list_id'];
            referencedRelation: 'lists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'list_likes_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      channels_with_stats: {
        Row: {
          id: string;
          youtube_channel_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          banner_url: string | null;
          subscriber_count: number | null;
          video_count: number | null;
          published_at: string | null;
          latest_video_at: string | null;
          category: string | null;
          tags: Json;
          metadata: Json;
          cache_updated_at: string;
          created_at: string;
          updated_at: string;
          review_count: number | null;
          average_rating: number | null;
          want_count: number | null;
          watching_count: number | null;
          watched_count: number | null;
        };
      };
      channel_stats: {
        Row: {
          channel_id: string;
          review_count: number;
          average_rating: number;
          want_count: number;
          watching_count: number;
          watched_count: number;
          updated_at: string;
        };
      };
    };
    Functions: {
      refresh_channel_stats: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      channel_status: ChannelStatus;
    };
  };
};
