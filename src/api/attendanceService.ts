import api from './axios';

export interface AttendanceSetting {
  id: string;
  minCheckinTime: string;
  maxCheckinTime: string;
  minCheckoutTime: string;
  maxCheckoutTime: string;
  lateThreshold: string;
  latitude?: number;
  longitude?: number;
  radiusMeter?: number;
  isActive: boolean;
}

export interface StudentAttendance {
  id: string;
  studentId: string;
  classroomId: string;
  academicYearId: string;
  semesterId: string;
  date: string;
  status: string; // 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | 'Terlambat'
  checkinTime?: string;
  checkoutTime?: string;
  notes?: string;
  recordedBy?: string;
  student?: any; // You can import Student type if needed
}

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  date: string;
  status: string; // 'Hadir' | 'Izin' | 'Sakit' | 'Alpa' | 'Terlambat' | 'Cuti'
  checkinTime?: string;
  checkoutTime?: string;
  notes?: string;
  recordedBy?: string;
  employee?: any;
}

export interface StudentAttendanceBatchItem {
  studentId: string;
  status: string;
  checkinTime?: string;
  checkoutTime?: string;
  notes?: string;
}

export interface EmployeeAttendanceBatchItem {
  employeeId: string;
  status: string;
  checkinTime?: string;
  checkoutTime?: string;
  notes?: string;
}

export const getAttendanceSetting = async () => {
  const response = await api.get('/attendances/settings');
  return response.data;
};

export const updateAttendanceSetting = async (data: Partial<AttendanceSetting>) => {
  const response = await api.patch('/attendances/settings', data);
  return response.data;
};

export const getStudentAttendances = async (params?: Record<string, any>) => {
  const response = await api.get('/attendances/students', { params });
  return response.data;
};

export const upsertStudentAttendance = async (data: Partial<StudentAttendance>) => {
  const response = await api.post('/attendances/students/upsert', data);
  return response.data;
};

export const upsertStudentAttendanceBatch = async (
  classroomId: string,
  academicYearId: string,
  semesterId: string,
  date: string,
  attendances: StudentAttendanceBatchItem[]
) => {
  const response = await api.post('/attendances/students/batch', {
    classroomId,
    academicYearId,
    semesterId,
    date,
    attendances,
  });
  return response.data;
};

export const getEmployeeAttendances = async (params?: Record<string, any>) => {
  const response = await api.get('/attendances/employees', { params });
  return response.data;
};

export const upsertEmployeeAttendance = async (data: Partial<EmployeeAttendance>) => {
  const response = await api.post('/attendances/employees/upsert', data);
  return response.data;
};

export const upsertEmployeeAttendanceBatch = async (
  date: string,
  attendances: EmployeeAttendanceBatchItem[]
) => {
  const response = await api.post('/attendances/employees/batch', {
    date,
    attendances,
  });
  return response.data;
};
