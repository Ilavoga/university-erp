import type { Student, Course, HousingListing, MarketplaceListing } from './types';

export const mockStudents: Student[] = [
  {
    id: '1',
    email: 'john.doe@university.edu',
    name: 'John Doe',
    role: 'student',
    studentId: 'STU001',
    program: 'Computer Science',
    year: 3,
    gpa: 3.75,
    enrollmentDate: new Date('2022-09-01'),
    createdAt: new Date('2022-09-01'),
  },
  {
    id: '2',
    email: 'jane.smith@university.edu',
    name: 'Jane Smith',
    role: 'student',
    studentId: 'STU002',
    program: 'Business Administration',
    year: 2,
    gpa: 3.85,
    enrollmentDate: new Date('2023-09-01'),
    createdAt: new Date('2023-09-01'),
  },
];

export const mockCourses: Course[] = [
  {
    id: 'c1',
    code: 'CS101',
    name: 'Introduction to Programming',
    description: 'Learn the fundamentals of programming',
    facultyId: '3',
    credits: 3,
    semester: 'Fall 2024',
    enrolledStudents: ['1'],
  },
  {
    id: 'c2',
    code: 'CS301',
    name: 'Data Structures & Algorithms',
    description: 'Advanced data structures and algorithm design',
    facultyId: '3',
    credits: 4,
    semester: 'Fall 2024',
    enrolledStudents: ['1'],
  },
];

export const mockHousing: HousingListing[] = [];
export const mockMarketplace: MarketplaceListing[] = [];

export const db = {
  students: mockStudents,
  courses: mockCourses,
  housing: mockHousing,
  marketplace: mockMarketplace,
  users: [...mockStudents],
};
