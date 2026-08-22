import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';
import { Login } from '../pages/Login/Login';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Layout } from '../components/Layout/Layout';
import { AcademicYears } from '../pages/Academic/AcademicYears';
import { Semesters } from '../pages/Academic/Semesters';
import { Grades } from '../pages/Academic/Grades';
import { Classrooms } from '../pages/Academic/Classrooms';
import { Subjects } from '../pages/Academic/Subjects';
import { ClassPeriods } from '../pages/Academic/ClassPeriods';
import { Permissions } from '../pages/Admin/Permissions';
import { Roles } from '../pages/Admin/Roles';
import { Users } from '../pages/Admin/Users';
import { Positions } from '../pages/Entities/Positions';
import { Employees } from '../pages/Entities/Employees';
import { Students } from '../pages/Entities/Students';
import { StudentDetail } from '../pages/Entities/StudentDetail';
import { AttendanceSettings } from '../pages/Attendance/AttendanceSettings';
import { StudentAttendancePage } from '../pages/Attendance/StudentAttendance';
import { EmployeeAttendancePage } from '../pages/Attendance/EmployeeAttendance';

import { AssessmentComponents } from '../pages/Assessment/AssessmentComponents';
import { Exams } from '../pages/Assessment/Exams';
import { ExamScores } from '../pages/Assessment/ExamScores';
import { Achievements } from '../pages/StudentAffairs/Achievements';
import { Violations } from '../pages/StudentAffairs/Violations';
import { Schedules } from '../pages/Academic/Schedules';
import { Promotions } from '../pages/Academic/Promotions';
import { BatchPromote } from '../pages/Academic/BatchPromote';
import { Graduations } from '../pages/Academic/Graduations';
import { SchoolProfilePage } from '../pages/SchoolProfile/SchoolProfile';
import { Announcements } from '../pages/Announcements/Announcements';
import { IncomingLetters } from '../pages/Letters/IncomingLetters';
import { OutgoingLetters } from '../pages/Letters/OutgoingLetters';
import { LetterTemplates } from '../pages/Letters/LetterTemplates';
import { HardwareLogs } from '../pages/Hardware/HardwareLogs';
import { IdentityRegistration } from '../pages/Hardware/IdentityRegistration';
import { AccountSettings } from '../pages/Settings/AccountSettings';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/academic/years" element={<AcademicYears />} />
              <Route path="/academic/semesters" element={<Semesters />} />
              <Route path="/academic/grades" element={<Grades />} />
              <Route path="/academic/classrooms" element={<Classrooms />} />
              <Route path="/academic/subjects" element={<Subjects />} />
              <Route path="/academic/class-periods" element={<ClassPeriods />} />
              <Route path="/admin/permissions" element={<Permissions />} />
              <Route path="/admin/roles" element={<Roles />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/entities/positions" element={<Positions />} />
              <Route path="/entities/employees" element={<Employees />} />
              <Route path="/entities/students" element={<Students />} />
              <Route path="/entities/students/:id" element={<StudentDetail />} />
              <Route path="/attendance/settings" element={<AttendanceSettings />} />
              <Route path="/attendance/students" element={<StudentAttendancePage />} />
              <Route path="/attendance/employees" element={<EmployeeAttendancePage />} />

              <Route path="/assessment/components" element={<AssessmentComponents />} />
              <Route path="/assessment/exams" element={<Exams />} />
              <Route path="/assessment/exams/:examId/scores" element={<ExamScores />} />
              <Route path="/student-affairs/achievements" element={<Achievements />} />
              <Route path="/student-affairs/violations" element={<Violations />} />

              <Route path="/academic/schedules" element={<Schedules />} />
              <Route path="/academic/promotions" element={<Promotions />} />
              <Route path="/academic/promotions/batch" element={<BatchPromote />} />
              <Route path="/academic/graduations" element={<Graduations />} />
              <Route path="/profile/school" element={<SchoolProfilePage />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/letters/incoming" element={<IncomingLetters />} />
              <Route path="/letters/outgoing" element={<OutgoingLetters />} />
              <Route path="/letters/templates" element={<LetterTemplates />} />
              <Route path="/hardware/logs" element={<HardwareLogs />} />
              <Route path="/hardware/registration" element={<IdentityRegistration />} />
              <Route path="/settings" element={<AccountSettings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
