import api from './axios';

export interface DashboardSummary {
  totalStudents: number;
  totalEmployees: number;
  activeClassrooms: number;
  academicYear: {
    name: string;
    semester: string;
  };
  attendance: {
    present: number;
    sickLeave: number;
    absent: number;
  };
  classesWithoutAttendance: number;
  absentEmployees: number;
  recentActivities: {
    id: string;
    message: string;
    createdAt: string;
    status: string;
  }[];
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const response = await api.get('/dashboard/summary');
  return response.data;
};
