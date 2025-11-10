import db from '../../lib/db';
import type { User } from '@/lib/types';

export class UserRepository {
  findByEmail(email: string): User | null {
    const row = db.prepare(`
      SELECT id, email, name, role, created_at as createdAt
      FROM users 
      WHERE email = ?
    `).get(email) as any;

    if (!row) return null;

    return {
      id: row.id.toString(),
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: new Date(row.createdAt)
    };
  }

  findById(id: string): User | null {
    const row = db.prepare(`
      SELECT id, email, name, role, created_at as createdAt
      FROM users 
      WHERE id = ?
    `).get(Number(id)) as any;

    if (!row) return null;

    return {
      id: row.id.toString(),
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: new Date(row.createdAt)
    };
  }

  verifyPassword(email: string, password: string): boolean {
    // In production, use bcrypt.compare()
    // For demo purposes, we're accepting any password
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    return !!user;
  }

  getStudentDetails(userId: string) {
    return db.prepare(`
      SELECT s.*, u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `).get(Number(userId));
  }

  getAllStudents() {
    return db.prepare(`
      SELECT u.id, u.name, u.email, s.student_id, s.program, s.year, s.gpa
      FROM users u
      JOIN students s ON u.id = s.user_id
      WHERE u.role = 'student'
      ORDER BY u.name
    `).all();
  }
}