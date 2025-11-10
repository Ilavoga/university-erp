'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, FileText, Star, Filter, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Recommendation {
  id: number;
  type: 'course' | 'event' | 'resource' | 'marketplace';
  target_id: number;
  score: number;
  reason_text: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId: user.id,
        limit: '20',
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await fetch(`/api/recommendations?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setError('Failed to load recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user, filterType]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-5 w-5" />;
      case 'resource':
        return <FileText className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resource':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'event':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    return 'text-gray-600';
  };

  const handleViewDetails = (rec: Recommendation) => {
    if (rec.type === 'course') {
      router.push(`/dashboard/learning?courseId=${rec.target_id}`);
    }
    // Add other type handlers as needed
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

  if (error) {
    return (
      <DashboardLayout>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 text-center">{error}</p>
            <Button className="mt-4" onClick={fetchRecommendations}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">AI-Powered Recommendations</h1>
                  <p className="text-slate-600 mt-1">
                    Personalized suggestions based on your interests and performance
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Bar */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-slate-500" />
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'course' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('course')}
                >
                  Courses
                </Button>
                <Button
                  variant={filterType === 'resource' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('resource')}
                >
                  Resources
                </Button>
                <Button
                  variant={filterType === 'event' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('event')}
                >
                  Events
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations Grid */}
        {recommendations.length === 0 ? (
          <Card className="border-slate-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Star className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No recommendations available</p>
              <p className="text-gray-500 text-sm mt-2">
                Complete more courses to get personalized suggestions
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge className={`${getTypeColor(rec.type)} border`}>
                      <div className="flex items-center gap-1">
                        {getTypeIcon(rec.type)}
                        <span className="capitalize">{rec.type}</span>
                      </div>
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className={`h-4 w-4 ${getRelevanceColor(rec.score)}`} />
                      <span className={`text-sm font-semibold ${getRelevanceColor(rec.score)}`}>
                        {Math.round(rec.score * 100)}%
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {rec.title || 'Untitled'}
                  </h3>

                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                    {rec.description || 'No description available'}
                  </p>

                  {rec.reason_text && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-blue-900 text-xs font-medium mb-1">Why this is recommended:</p>
                      <p className="text-blue-700 text-sm">{rec.reason_text}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleViewDetails(rec)}
                    >
                      View Details
                    </Button>
                    {rec.type === 'course' && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => router.push(`/dashboard/learning?courseId=${rec.target_id}`)}
                      >
                        Enroll
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
