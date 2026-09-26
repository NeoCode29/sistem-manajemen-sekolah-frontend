import api from './axios';

export interface DashboardSummary {
  studentInfo?: {
    id: string;
    fullName: string;
    nis: string;
    classroomName: string;
  };
  todayAttendance?: {
    status: 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA' | string | null;
    checkinTime: string | null;
    checkoutTime: string | null;
    notes?: string | null;
  } | null;
  attendanceStats?: {
    percentage: number;
    totalDays: number;
    present: number;
    sick: number;
    permit: number;
    absent: number;
  };
  attendancePercentage: number;
  violationPoints: number;
  todaySchedules: {
    id: string;
    time: string;
    subject: string;
    teacher: string;
    room: string;
  }[];
}

export interface StudentProfileData {
  id: string;
  nis: string;
  nisn: string;
  fullName: string;
  gender: string;
  status: string;
  birthPlace?: string;
  birthDate?: string;
  religion?: string;
  address?: string;
  major?: { id: string; name: string };
  guardians?: any[];
  enrollments?: any[];
}

export interface ReportCard {
  id: string;
  academicYear: { name: string };
  semester: { name: string };
  classroom: { name: string };
  details: {
    id: string;
    subject: { name: string };
    finalScore: string;
    kkm: string;
    predicate: string;
  }[];
}

export interface DisciplineData {
  achievements: any[];
  violations: any[];
}

export const getMyStudent = async (): Promise<StudentProfileData> => {
  const response = await api.get('/students/my');
  return response.data;
};

export const getMyDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await api.get('/students/my/dashboard-summary');
  return response.data;
};

export const getMyGrades = async (): Promise<ReportCard[]> => {
  const response = await api.get('/students/my/grades');
  return response.data;
};

export const getMyDiscipline = async (): Promise<DisciplineData> => {
  const response = await api.get('/students/my/discipline');
  return response.data;
};

export const getMySchedule = async (): Promise<any[]> => {
  const response = await api.get('/students/my/schedule');
  return response.data;
};
