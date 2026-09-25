import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMyDashboardSummary, type DashboardSummary } from '../../api/studentPortalService';
import { getMyAnnouncements, type Announcement } from '../../api/announcementService';
import { AnnouncementDetailModal } from '../Announcements/AnnouncementDetailModal';
import { StudentDashboardView } from './views/StudentDashboardView';
import { GuardianDashboardView } from './views/GuardianDashboardView';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isGuardian = user?.roles?.some(r => r.name === 'Orang Tua / Wali');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summary, ann] = await Promise.all([
          getMyDashboardSummary(),
          getMyAnnouncements()
        ]);
        setData(summary);
        setAnnouncements(ann);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectAnnouncement = (ann: Announcement) => {
    setSelectedAnnouncement(ann);
    setIsDetailOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="text-sm font-medium">Memuat data dashboard portal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter max-w-7xl mx-auto w-full min-w-0 max-w-full overflow-x-hidden">
      {isGuardian ? (
        <GuardianDashboardView
          data={data}
          announcements={announcements}
          guardianName={user?.name || 'Wali Murid'}
          onSelectAnnouncement={handleSelectAnnouncement}
        />
      ) : (
        <StudentDashboardView
          data={data}
          announcements={announcements}
          studentName={user?.name || data?.studentInfo?.fullName || 'Siswa'}
          onSelectAnnouncement={handleSelectAnnouncement}
        />
      )}

      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        open={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedAnnouncement(null);
        }}
      />
    </div>
  );
};
