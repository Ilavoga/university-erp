'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Home,
  Heart,
  Bus,
  Calendar,
  GraduationCap,
  ClipboardList,
  BarChart3,
  ShoppingBag,
  LogOut,
  Bell,
  Settings
} from 'lucide-react';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['student', 'admin', 'faculty', 'business'] },
    { name: 'Learning', href: '/dashboard/learning', icon: BookOpen, roles: ['student', 'faculty'] },
    { name: 'Courses', href: '/dashboard/courses', icon: GraduationCap, roles: ['admin', 'faculty'] },
    { name: 'Students', href: '/dashboard/students', icon: Users, roles: ['admin', 'faculty'] },
    { name: 'Housing', href: '/dashboard/housing', icon: Home, roles: ['student', 'admin'] },
    { name: 'Health', href: '/dashboard/health', icon: Heart, roles: ['student', 'admin'] },
    { name: 'Transport', href: '/dashboard/transport', icon: Bus, roles: ['student', 'admin'] },
    { name: 'Events', href: '/dashboard/events', icon: Calendar, roles: ['student', 'admin', 'faculty'] },
    { name: 'Enrollment', href: '/dashboard/enrollment', icon: ClipboardList, roles: ['admin'] },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, roles: ['admin'] },
    { name: 'Marketplace', href: '/dashboard/marketplace', icon: ShoppingBag, roles: ['student', 'business', 'admin'] },
  ];

  const filteredNavigation = navigation.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold text-white">UE</span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900">University ERP</h1>
              <p className="text-xs text-slate-500 capitalize">{user.role} Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <button
                key={item.name}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800">
              <AvatarFallback className="text-white font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2 border-slate-300 hover:bg-slate-100"
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-64">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h2>
              <p className="text-sm text-slate-500">Welcome back, {user.name.split(' ')[0]}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="relative border-slate-300">
                <Bell className="w-5 h-5" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                  3
                </Badge>
              </Button>
              <Button variant="outline" size="icon" className="border-slate-300">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
