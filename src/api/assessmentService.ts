import api from './axios';

export interface AssessmentType {
  id: string;
  code: string;
  name: string;
  isActive?: boolean;
}


export interface AssessmentComponent {
  id: string;
  name?: string;
  weight: number;
  classroomId?: string;
  subjectId?: string;
  academicYearId?: string;
  semesterId?: string;
  typeId?: string;
  isActive?: boolean;
  type?: AssessmentType;
}export interface Exam {
  id: string;
  academicYearId: string;
  semesterId: string;
  subjectId: string;
  classroomId: string;
  employeeId?: string; // Teacher
  title: string;
  examType: string; // "UH" (Ulangan Harian), "UTS", "UAS", "TUGAS", etc.
  examDate: string;
  description?: string;
  maxScore: number;
  weight: number; // for final grade calculation, e.g. 20%
  subject?: any;
  classroom?: any;
  academicYear?: any;
  semester?: any;
  typeId?: string;
  componentId?: string;
  type?: any;
  component?: any;
}

export interface ExamScore {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  notes?: string;
  student?: any;
}

export const getAssessmentTypes = async (): Promise<AssessmentType[]> => {
  const response = await api.get('/assessment/types');
  return response.data;
};

export const getAssessmentComponents = async (params?: Record<string, any>): Promise<AssessmentComponent[]> => {
  const response = await api.get('/assessment/components', { params });
  return response.data.data ? response.data.data : response.data;
};

export const createAssessmentComponent = async (data: Partial<AssessmentComponent>): Promise<AssessmentComponent> => {
  const response = await api.post('/assessment/components', data);
  return response.data;
};

export const updateAssessmentComponent = async (id: string, data: Partial<AssessmentComponent>): Promise<AssessmentComponent> => {
  const response = await api.patch(`/assessment/components/${id}`, data);
  return response.data;
};

export const deleteAssessmentComponent = async (id: string): Promise<void> => {
  await api.delete(`/assessment/components/${id}`);
};

export const generateDefaultComponents = async (payload: {
  classroomId: string;
  subjectId: string;
  academicYearId: string;
  semesterId: string;
}): Promise<AssessmentComponent[]> => {
  const response = await api.post('/assessment/components/generate-default', payload);
  return response.data;
};


// ==========================
// EXAMS (Assessments)
// ==========================
export const getExams = async (params?: Record<string, any>): Promise<Exam[]> => {
  const response = await api.get('/assessment/assessments', { params });
  const data = response.data.data ? response.data.data : response.data;
  return data.map((item: any) => ({
    ...item,
    examType: item.type?.name || 'TUGAS',
    examDate: item.assessmentDate,
    description: item.notes,
    weight: item.component?.weight || 1,
  }));
};

export const getExamById = async (id: string): Promise<Exam> => {
  const response = await api.get(`/assessment/assessments/${id}`);
  const item = response.data;
  return {
    ...item,
    examType: item.type?.name || 'TUGAS',
    examDate: item.assessmentDate,
    description: item.notes,
    weight: item.component?.weight || 1,
  };
};

export const createExam = async (data: Partial<Exam> | any): Promise<Exam> => {
  const response = await api.post('/assessment/assessments', data);
  return response.data;
};

export const updateExam = async (id: string, data: Partial<Exam> | any): Promise<Exam> => {
  const response = await api.patch(`/assessment/assessments/${id}`, data);
  return response.data;
};

export const deleteExam = async (id: string): Promise<void> => {
  await api.delete(`/assessment/assessments/${id}`);
};

// ==========================
// EXAM SCORES
// ==========================
export const getExamScores = async (examId: string): Promise<ExamScore[]> => {
  const response = await api.get(`/assessment/assessments/${examId}/scores`);
  return response.data;
};

export const upsertExamScoresBatch = async (
  examId: string, 
  scores: { studentId: string; score: number; notes?: string }[]
): Promise<void> => {
  await api.post(`/assessment/assessments/${examId}/scores`, { scores });
};

// ==========================
// VALIDATION & LOCK STATUS
// ==========================
export interface AssessmentLockStatus {
  isLocked: boolean;
  lockReason?: string | null;
  validation?: {
    id: string;
    status: string;
    submittedAt?: string;
    validatedAt?: string;
    notes?: string;
    validatedBy?: { fullName: string };
  } | null;
  approval?: {
    id: string;
    status: string;
    approvedAt?: string;
    notes?: string;
    approvedBy?: { fullName: string };
  } | null;
  canUnlock: boolean;
}

export const getAssessmentLockStatus = async (params: {
  classroomId: string;
  subjectId: string;
  academicYearId: string;
  semesterId: string;
}): Promise<AssessmentLockStatus> => {
  const res = await api.get('/assessment/validations/status', { params });
  return res.data;
};

export const reopenAssessmentForRevision = async (payload: {
  classroomId: string;
  subjectId: string;
  academicYearId: string;
  semesterId: string;
  reason: string;
}) => {
  const res = await api.post('/assessment/validations/reopen', payload);
  return res.data;
};

