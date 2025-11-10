// User Roles
export type UserRole = 'student' | 'admin' | 'faculty' | 'business';

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
}

export interface Student extends User {
  role: 'student';
  studentId: string;
  program: string;
  year: number;
  gpa: number;
  enrollmentDate: Date;
}

export interface Faculty extends User {
  role: 'faculty';
  department: string;
  courses: string[];
}

export interface Business extends User {
  role: 'business';
  businessName: string;
  category: string;
  description: string;
  verified: boolean;
}

// Module 1: Learning Platform
export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  facultyId: string;
  credits: number;
  semester: string; // Display string (backward compatibility)
  semesterYear?: number; // New localized format
  semesterStartMonth?: number; // New localized format
  semesterEndMonth?: number; // New localized format
  enrolledStudents: string[];
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  maxPoints: number;
  submissions: Submission[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
}

export interface LearningRecommendation {
  id: string;
  studentId: string;
  type: 'course' | 'resource' | 'tutor' | 'study-group';
  title: string;
  description: string;
  relevanceScore: number;
}

// Module 2: Student Life Services
export interface HousingListing {
  id: string;
  title: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  images: string[];
  available: boolean;
  landlordContact: string;
}

export interface HealthAppointment {
  id: string;
  studentId: string;
  type: 'general' | 'dental' | 'mental-health';
  date: Date;
  time: string;
  doctor: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

export interface TransportRoute {
  id: string;
  name: string;
  stops: string[];
  schedule: { time: string; stop: string }[];
  active: boolean;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organizerId: string;
  attendees: string[];
  category: string;
}

// Module 3: Administration
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrollmentDate: Date;
  status: 'active' | 'dropped' | 'completed';
  finalGrade?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  assessmentType: string;
  score: number;
  maxScore: number;
  date: Date;
}

export interface AnalyticsData {
  totalStudents: number;
  totalCourses: number;
  averageGPA: number;
  attendanceRate: number;
  enrollmentTrends: { month: string; count: number }[];
  performanceByDepartment: { department: string; avgGPA: number }[];
}

// Module 4: Marketplace
export interface MarketplaceListing {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  discount?: number;
  images: string[];
  rating: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  listingId: string;
  studentId: string;
  rating: number;
  comment: string;
  date: Date;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
}
