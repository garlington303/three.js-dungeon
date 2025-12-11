/*
  # Create Game Sessions Table

  1. New Tables
    - `game_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `score` (integer)
      - `gold_collected` (integer)
      - `enemies_defeated` (integer)
      - `final_health` (integer)
      - `duration_seconds` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `game_sessions` table
    - Add policy for users to create their own sessions
    - Add policy for users to read their own sessions
*/

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer DEFAULT 0,
  gold_collected integer DEFAULT 0,
  enemies_defeated integer DEFAULT 0,
  final_health integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own game sessions"
  ON game_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own game sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);