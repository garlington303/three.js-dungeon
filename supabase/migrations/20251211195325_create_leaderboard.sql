/*
  # Create Leaderboard View

  1. New Views
    - `leaderboard`
      - Top scores with player information
      - Ordered by score descending
      - Limited to top 100 players

  2. Security
    - View is readable by anyone for public leaderboard display
*/

CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.username,
  gs.score,
  gs.gold_collected,
  gs.enemies_defeated,
  gs.duration_seconds,
  gs.created_at,
  ROW_NUMBER() OVER (ORDER BY gs.score DESC) as rank
FROM game_sessions gs
JOIN profiles p ON gs.user_id = p.id
ORDER BY gs.score DESC
LIMIT 100;