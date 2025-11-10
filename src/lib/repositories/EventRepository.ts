import db from '../db';

export interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  capacity: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithAttendees extends Event {
  attendees: number;
  isRegistered?: boolean;
}

export interface EventRegistration {
  id: number;
  event_id: number;
  user_id: number;
  registration_date: string;
  status: string;
}

export class EventRepository {
  // Get all events with attendee count
  getAllEvents(userId?: number): EventWithAttendees[] {
    const stmt = db.prepare(`
      SELECT 
        e.*,
        COUNT(er.id) as attendees,
        CASE WHEN uer.user_id IS NOT NULL THEN 1 ELSE 0 END as isRegistered
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      LEFT JOIN event_registrations uer ON e.id = uer.event_id AND uer.user_id = ?
      GROUP BY e.id
      ORDER BY e.date, e.time
    `);
    return stmt.all(userId || 0) as EventWithAttendees[];
  }

  // Get event by ID
  getEventById(id: number, userId?: number): EventWithAttendees | undefined {
    const stmt = db.prepare(`
      SELECT 
        e.*,
        COUNT(er.id) as attendees,
        CASE WHEN uer.user_id IS NOT NULL THEN 1 ELSE 0 END as isRegistered
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      LEFT JOIN event_registrations uer ON e.id = uer.event_id AND uer.user_id = ?
      WHERE e.id = ?
      GROUP BY e.id
    `);
    return stmt.get(userId || 0, id) as EventWithAttendees | undefined;
  }

  // Create new event
  createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Event {
    const stmt = db.prepare(`
      INSERT INTO events (title, description, date, time, location, category, capacity, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      event.title,
      event.description,
      event.date,
      event.time,
      event.location,
      event.category,
      event.capacity,
      event.created_by
    );

    const newEvent = this.getEventById(result.lastInsertRowid as number);
    if (!newEvent) throw new Error('Failed to create event');
    return newEvent;
  }

  // Update event
  updateEvent(id: number, updates: Partial<Event>): Event | undefined {
    const allowedFields = ['title', 'description', 'date', 'time', 'location', 'category', 'capacity'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (fields.length === 0) {
      return this.getEventById(id);
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);

    const stmt = db.prepare(`
      UPDATE events 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    stmt.run(...values, id);
    return this.getEventById(id);
  }

  // Delete event
  deleteEvent(id: number): boolean {
    const stmt = db.prepare('DELETE FROM events WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Register user for event
  registerForEvent(eventId: number, userId: number): EventRegistration {
    const event = this.getEventById(eventId);
    if (!event) throw new Error('Event not found');
    
    if (event.attendees >= event.capacity) {
      throw new Error('Event is full');
    }

    const stmt = db.prepare(`
      INSERT INTO event_registrations (event_id, user_id)
      VALUES (?, ?)
    `);
    
    try {
      const result = stmt.run(eventId, userId);
      const getStmt = db.prepare('SELECT * FROM event_registrations WHERE id = ?');
      return getStmt.get(result.lastInsertRowid) as EventRegistration;
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Already registered for this event');
      }
      throw error;
    }
  }

  // Unregister from event
  unregisterFromEvent(eventId: number, userId: number): boolean {
    const stmt = db.prepare(`
      DELETE FROM event_registrations 
      WHERE event_id = ? AND user_id = ?
    `);
    const result = stmt.run(eventId, userId);
    return result.changes > 0;
  }

  // Get user's registered events
  getUserEvents(userId: number): EventWithAttendees[] {
    const stmt = db.prepare(`
      SELECT 
        e.*,
        COUNT(er.id) as attendees,
        1 as isRegistered
      FROM events e
      INNER JOIN event_registrations uer ON e.id = uer.event_id AND uer.user_id = ?
      LEFT JOIN event_registrations er ON e.id = er.event_id
      GROUP BY e.id
      ORDER BY e.date, e.time
    `);
    return stmt.all(userId) as EventWithAttendees[];
  }

  // Get upcoming events
  getUpcomingEvents(userId?: number, limit: number = 10): EventWithAttendees[] {
    const stmt = db.prepare(`
      SELECT 
        e.*,
        COUNT(er.id) as attendees,
        CASE WHEN uer.user_id IS NOT NULL THEN 1 ELSE 0 END as isRegistered
      FROM events e
      LEFT JOIN event_registrations er ON e.id = er.event_id
      LEFT JOIN event_registrations uer ON e.id = uer.event_id AND uer.user_id = ?
      WHERE date(e.date) >= date('now')
      GROUP BY e.id
      ORDER BY e.date, e.time
      LIMIT ?
    `);
    return stmt.all(userId || 0, limit) as EventWithAttendees[];
  }
}