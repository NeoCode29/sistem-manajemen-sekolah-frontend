import api from './axios';

export interface Student {
  id: string;
  nisn: string;
  nis: string;
  user: {
    name: string;
  };
  classId: string;
  class: {
    name: string;
    level: {
      level: number;
    };
  };
  status: string;
}

export interface PromotionPayload {
  studentIds: string[];
  fromAcademicYearId: string;
  fromSemesterId: string;
  fromClassId: string;
  toAcademicYearId: string;
  toSemesterId: string;
  toClassId: string;
}

export interface GraduationPayload {
  studentIds: string[];
  fromAcademicYearId: string;
  fromSemesterId: string;
  fromClassId: string;
  graduationDate: string;
  graduationNotes?: string;
}

export const getStudentsByClass = async (
  academicYearId: string,
  semesterId: string,
  classId: string
): Promise<Student[]> => {
  const response = await api.get('/students', {
    params: {
      academicYearId,
      semesterId,
      classId,
      status: 'AKTIF'
    }
  });
  return response.data;
};

export const processPromotion = async (payload: PromotionPayload) => {
  const response = await api.post('/promotions/batch', payload);
  return response.data;
};

export const processGraduation = async (payload: GraduationPayload) => {
  const response = await api.post('/graduations/batch-graduate', payload);
  return response.data;
};
