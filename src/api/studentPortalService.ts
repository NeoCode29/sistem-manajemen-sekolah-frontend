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

export interface StudentGuardianData {
  id: string;
  relationship: string;
  fullName: string;
  nationalId?: string | null;
  nik?: string | null;
  birthYear?: number | null;
  isAlive?: boolean;
  educationLevel?: string | null;
  education?: string | null;
  occupation?: string | null;
  occupationRef?: { id: string; name: string } | null;
  monthlyIncome?: string | null;
  specialNeeds?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isPrimary?: boolean;
}

export interface StudentEnrollmentData {
  id: string;
  status: string;
  academicYear?: { name: string };
  semester?: { name: string };
  classroom?: { 
    id: string; 
    name: string; 
    major?: { id: string; name: string; code?: string } 
  };
}

export interface StudentProfileData {
  id: string;
  nis: string;
  nisn?: string | null;
  fullName: string;
  nickname?: string | null;
  gender: string;
  status: string;
  birthPlace?: string | null;
  birthDate?: string | null;
  religion?: string | null;
  nationality?: string | null;

  // Dapodik Kependudukan
  nationalId?: string | null;
  nik?: string | null;
  familyCardNo?: string | null;
  noKk?: string | null;
  birthCertificateNo?: string | null;
  birthCertNo?: string | null;
  birthOrder?: number | null;
  siblingCount?: number | null;

  // Fisik & Medis
  height?: number | null;
  heightCm?: number | null;
  weight?: number | null;
  weightKg?: number | null;
  headCircumference?: number | null;
  headCircumferenceCm?: number | null;
  bloodType?: string | null;
  medicalHistory?: string | null;
  illnessHistory?: string | null;
  specialNeeds?: string | null;
  physicalDisability?: string | null;

  // Alamat & Domisili
  address?: string | null;
  subVillage?: string | null;
  rt?: string | null;
  rw?: string | null;
  village?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  residenceType?: string | null;

  // Transportasi
  transportationMode?: string | null;
  transportation?: string | null;
  distanceToSchool?: number | string | null;
  distanceToSchoolKm?: number | null;
  travelTimeToSchool?: number | null;
  travelTimeMinutes?: number | null;

  // Kontak & Sekolah Asal
  phone?: string | null;
  email?: string | null;
  previousSchoolName?: string | null;
  previousSchoolNpsn?: string | null;
  previousCertificateNo?: string | null;
  diplomaNumber?: string | null;
  skhunNumber?: string | null;
  examParticipantNumber?: string | null;
  admissionDate?: string | null;

  // Bantuan Kesejahteraan
  kpsReceiver?: boolean;
  kipReceiver?: boolean;
  pipEligible?: boolean;
  kipNumber?: string | null;
  kpsNumber?: string | null;
  pipReason?: string | null;
  scholarshipHistory?: string | null;

  // Relasi
  major?: { id: string; name: string; code?: string };
  guardians?: StudentGuardianData[];
  enrollments?: StudentEnrollmentData[];
  users?: { id: string; username: string; name: string; isActive: boolean }[];
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
