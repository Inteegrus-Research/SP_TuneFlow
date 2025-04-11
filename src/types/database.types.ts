export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      playlists: {
        Row: {
          id: string
          name: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_id?: string
          created_at?: string
        }
      }
      playlist_tracks: {
        Row: {
          id: string
          playlist_id: string
          track_id: string
          track_name: string
          artist_name: string
          image_url: string | null
          added_at: string
        }
        Insert: {
          id?: string
          playlist_id: string
          track_id: string
          track_name: string
          artist_name: string
          image_url?: string | null
          added_at?: string
        }
        Update: {
          id?: string
          playlist_id?: string
          track_id?: string
          track_name?: string
          artist_name?: string
          image_url?: string | null
          added_at?: string
        }
      }
    }
  }
}