import api from './axios';
import { getStudents } from './studentService';
import { getEmployees } from './employeeService';
import { getClassrooms, getAcademicYears, getSemesters } from './academicService';

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
  // Fetch the mock/base summary from the backend
  const response = await api.get('/dashboard/summary');
  const baseSummary = response.data;

  try {
    // Fetch real data concurrently
    const [students, employees, classrooms, academicYears, semesters] = await Promise.all([
      getStudents(),
      getEmployees(),
      getClassrooms(),
      getAcademicYears(),
      getSemesters()
    ]);

    // Calculate dynamic values
    const activeStudentsCount = students.filter(s => s.status === 'AKTIF' || s.isActive).length;
    const activeEmployeesCount = employees.filter(e => e.isActive).length;
    const activeClassroomsCount = classrooms.length;
    
    const activeYear = academicYears.find(ay => ay.isActive);
    const activeSemester = semesters.find(s => s.isActive);

    // Merge dynamic card data with the rest of the backend summary
    return {
      ...baseSummary,
      totalStudents: activeStudentsCount,
      totalEmployees: activeEmployeesCount,
      activeClassrooms: activeClassroomsCount,
      academicYear: {
        name: activeYear ? activeYear.name : baseSummary.academicYear.name,
        semester: activeSemester ? activeSemester.name : baseSummary.academicYear.semester
      }
    };
  } catch (error) {
    console.error('Failed to fetch dynamic dashboard data, falling back to backend summary', error);
    return baseSummary;
  }
};
