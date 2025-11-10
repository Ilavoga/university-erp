import db from '../db';

export interface Recommendation {
  id: number;
  user_id: number;
  type: 'course' | 'event' | 'resource' | 'marketplace';
  target_id: number;
  score: number;
  reason_text: string;
  metadata: string;
  created_at: string;
  dismissed_at: string | null;
  // Populated from joins
  title?: string;
  description?: string;
  details?: Record<string, unknown>;
}

export interface RecommendationFilters {
  type?: 'course' | 'event' | 'resource' | 'marketplace';
  minScore?: number;
  limit?: number;
  includeDismissed?: boolean;
}

export class RecommendationRepository {
  // Get recommendations for a user with optional filters
  getRecommendations(userId: number, filters?: RecommendationFilters): Recommendation[] {
    const {
      type,
      minScore = 0,
      limit = 20,
      includeDismissed = false,
    } = filters || {};

    let query = `
      SELECT 
        r.id,
        r.user_id,
        r.type,
        r.target_id,
        r.score,
        r.reason_text,
        r.metadata,
        r.created_at,
        r.dismissed_at,
        CASE 
          WHEN r.type = 'course' THEN c.name
          WHEN r.type = 'resource' THEN lr.title
          ELSE NULL
        END as title,
        CASE 
          WHEN r.type = 'course' THEN c.description
          WHEN r.type = 'resource' THEN lr.description
          ELSE NULL
        END as description
      FROM recommendations r
      LEFT JOIN courses c ON r.type = 'course' AND r.target_id = c.id
      LEFT JOIN learning_resources lr ON r.type = 'resource' AND r.target_id = lr.id
      WHERE r.user_id = ?
    `;

    const params: (string | number)[] = [userId];

    if (!includeDismissed) {
      query += ' AND r.dismissed_at IS NULL';
    }

    if (type) {
      query += ' AND r.type = ?';
      params.push(type);
    }

    if (minScore > 0) {
      query += ' AND r.score >= ?';
      params.push(minScore);
    }

    query += ' ORDER BY r.score DESC, r.created_at DESC';

    if (limit > 0) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const stmt = db.prepare(query);
    const results = stmt.all(...params) as Recommendation[];

    // Parse metadata JSON
    return results.map(rec => ({
      ...rec,
      metadata: rec.metadata ? JSON.parse(rec.metadata) : {},
    }));
  }

  // Get a single recommendation by ID
  getRecommendationById(id: number): Recommendation | undefined {
    const stmt = db.prepare(`
      SELECT 
        r.id,
        r.user_id,
        r.type,
        r.target_id,
        r.score,
        r.reason_text,
        r.metadata,
        r.created_at,
        r.dismissed_at,
        CASE 
          WHEN r.type = 'course' THEN c.name
          WHEN r.type = 'resource' THEN lr.title
          ELSE NULL
        END as title,
        CASE 
          WHEN r.type = 'course' THEN c.description
          WHEN r.type = 'resource' THEN lr.description
          ELSE NULL
        END as description
      FROM recommendations r
      LEFT JOIN courses c ON r.type = 'course' AND r.target_id = c.id
      LEFT JOIN learning_resources lr ON r.type = 'resource' AND r.target_id = lr.id
      WHERE r.id = ?
    `);

    const result = stmt.get(id) as Recommendation | undefined;
    if (result && result.metadata) {
      result.metadata = JSON.parse(result.metadata);
    }
    return result;
  }

  // Dismiss a recommendation
  dismissRecommendation(id: number, userId: number): void {
    const stmt = db.prepare(`
      UPDATE recommendations
      SET dismissed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(id, userId);
  }

  // Create a new recommendation
  createRecommendation(
    userId: number,
    type: 'course' | 'event' | 'resource' | 'marketplace',
    targetId: number,
    score: number,
    reasonText: string,
    metadata?: Record<string, unknown>
  ): Recommendation {
    const stmt = db.prepare(`
      INSERT INTO recommendations (user_id, type, target_id, score, reason_text, metadata)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userId,
      type,
      targetId,
      score,
      reasonText,
      metadata ? JSON.stringify(metadata) : null
    );

    const recommendation = this.getRecommendationById(result.lastInsertRowid as number);
    if (!recommendation) {
      throw new Error('Failed to create recommendation');
    }

    return recommendation;
  }

  // Get recommendation statistics
  getRecommendationStats(userId: number) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_recommendations,
        COUNT(CASE WHEN dismissed_at IS NULL THEN 1 END) as active_recommendations,
        AVG(score) as avg_score,
        COUNT(CASE WHEN type = 'course' THEN 1 END) as course_count,
        COUNT(CASE WHEN type = 'resource' THEN 1 END) as resource_count,
        COUNT(CASE WHEN type = 'event' THEN 1 END) as event_count,
        COUNT(CASE WHEN type = 'marketplace' THEN 1 END) as marketplace_count
      FROM recommendations
      WHERE user_id = ?
    `);

    return stmt.get(userId);
  }
}
