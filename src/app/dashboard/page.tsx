'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  BookOpen,
  TrendingUp,
  Calendar,
  GraduationCap,
  Home,
  Heart,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  averageGPA: number;
  attendanceRate: number;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
}

interface StudentCourse {
  id: string;
  code: string;
  name: string;
  progress: number;
  nextClass: string;
  assignmentsDue: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [studentCourses, setStudentCourses] = useState<StudentCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        if (user?.role === 'admin') {
          // Fetch admin stats
          const statsRes = await fetch('/api/dashboard/stats');
          const statsData = await statsRes.json();
          setStats(statsData);
        } else if (user?.role === 'student') {
          // Fetch student courses using existing learning endpoint
          const coursesRes = await fetch(`/api/learning/courses?studentId=${user.id}`);
          const coursesData = await coursesRes.json();
          setStudentCourses(coursesData);
        }

        // Fetch notifications and events for all users using existing endpoints
        const [notificationsRes, eventsRes] = await Promise.all([
          fetch('/api/dashboard/notifications'),
          fetch(`/api/events?upcoming=true${user ? `&userId=${user.id}` : ''}`),
        ]);

        const notificationsData = await notificationsRes.json();
        const eventsData = await eventsRes.json();

        setNotifications(notificationsData);
        // Limit events to 5 for dashboard display
        setEvents(eventsData.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const adminStats = stats ? [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      change: '+12%',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      change: '+3%',
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Average GPA',
      value: stats.averageGPA.toFixed(2),
      icon: TrendingUp,
      change: '+0.2',
      color: 'from-amber-500 to-amber-600'
    },
    {
      title: 'Attendance Rate',
      value: `${(stats.attendanceRate * 100).toFixed(0)}%`,
      icon: CheckCircle,
      change: '+5%',
      color: 'from-purple-500 to-purple-600'
    },
  ] : [];

  const studentStats = [
    {
      title: 'My Courses',
      value: studentCourses.length,
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Assignments Due',
      value: studentCourses.reduce((sum, course) => sum + course.assignmentsDue, 0),
      icon: Calendar,
      color: 'from-red-500 to-red-600',
    },
    {
      title: 'Current GPA',
      value: '3.7',
      icon: GraduationCap,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      title: 'Upcoming Events',
      value: events.length,
      icon: Calendar,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  const displayStats = user?.role === 'admin' ? adminStats : studentStats;

  const quickActions = user?.role === 'student' ? [
    { title: 'Browse Housing', icon: Home, href: '/dashboard/housing', color: 'bg-blue-500' },
    { title: 'Book Health Appointment', icon: Heart, href: '/dashboard/health', color: 'bg-red-500' },
    { title: 'View Marketplace', icon: ShoppingBag, href: '/dashboard/marketplace', color: 'bg-emerald-500' },
    { title: 'Join Events', icon: Calendar, href: '/dashboard/events', color: 'bg-purple-500' },
  ] : [
    { title: 'Manage Students', icon: Users, href: '/dashboard/students', color: 'bg-blue-500' },
    { title: 'Manage Courses', icon: BookOpen, href: '/dashboard/courses', color: 'bg-emerald-500' },
    { title: 'View Analytics', icon: TrendingUp, href: '/dashboard/analytics', color: 'bg-purple-500' },
    { title: 'Enrollments', icon: GraduationCap, href: '/dashboard/enrollment', color: 'bg-amber-500' },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return AlertCircle;
      case 'event':
        return Calendar;
      case 'grade':
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'bg-amber-50 border-amber-200';
      case 'event':
        return 'bg-blue-50 border-blue-200';
      case 'grade':
        return 'bg-emerald-50 border-emerald-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'assignment':
        return 'text-amber-600';
      case 'event':
        return 'text-blue-600';
      case 'grade':
        return 'text-emerald-600';
      default:
        return 'text-slate-600';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayStats.map((stat) => (
            <Card key={stat.title} className="border-slate-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</h3>
                    {stat.change && (
                      <p className="text-sm text-emerald-600 mt-1 font-medium">
                        {stat.change} from last month
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access frequently used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center gap-3 border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                  onClick={() => window.location.href = action.href}
                >
                  <div className={`p-4 rounded-xl ${action.color}`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-medium text-slate-900">{action.title}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity & Upcoming */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Notifications */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Stay updated with latest activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-4 border rounded-lg ${getNotificationColor(notification.type)}`}
                    >
                      <Icon className={`w-5 h-5 mt-0.5 ${getNotificationIconColor(notification.type)}`} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{notification.title}</p>
                        <p className="text-sm text-slate-600">{notification.message}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-slate-500 py-8">No notifications</p>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Don't miss out on campus activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {events.length > 0 ? (
                <>
                  {events.map((event) => (
                    <div key={event.id} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                          {event.category}
                        </Badge>
                        <span className="text-sm text-slate-500">{event.date}</span>
                      </div>
                      <h4 className="font-semibold text-slate-900">{event.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{event.location} • {event.time}</p>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full border-slate-300">
                    View All Events <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </>
              ) : (
                <p className="text-center text-slate-500 py-8">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
