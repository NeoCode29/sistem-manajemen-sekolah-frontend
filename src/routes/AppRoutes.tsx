import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthorizedRoute } from './AuthorizedRoute';
import { AuthProvider } from '../context/AuthContext';
import { Login } from '../pages/Login/Login';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Layout } from '../components/Layout/Layout';
import { AcademicYears } from '../pages/Academic/AcademicYears';
import { Semesters } from '../pages/Academic/Semesters';
import { Grades } from '../pages/Academic/Grades';
import { Majors } from '../pages/Academic/Majors';
import { Classrooms } from '../pages/Academic/Classrooms';
import { ClassroomDetail } from '../pages/Academic/ClassroomDetail';
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
import { ReportCards } from '../pages/Assessment/ReportCards';
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
import { HomeroomDashboard } from '../pages/Homeroom/HomeroomDashboard';
import { Forbidden } from '../pages/Error/Forbidden';
import { ComponentShowcase } from '../pages/DesignSystem/ComponentShowcase';
import { KioskAttendancePage } from '../pages/Kiosk/KioskAttendance';

import { StudentLayout } from '../components/Layout/StudentLayout';
import { StudentDashboard } from '../pages/Student/StudentDashboard';
import { StudentProfile } from '../pages/Student/StudentProfile';
import { StudentGrades } from '../pages/Student/StudentGrades';
import { StudentDiscipline } from '../pages/Student/StudentDiscipline';

export const AppRoutes: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/kiosk/attendance" element={<KioskAttendancePage />} />
          <Route path="/design-system" element={<ComponentShowcase />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ui-demo" element={<ComponentShowcase />} />
              <Route path="/homeroom/dashboard" element={<HomeroomDashboard />} />
              <Route path="/403" element={<Forbidden />} />
              
              {/* Akademik & Kurikulum */}
              <Route element={<AuthorizedRoute requiredPermissions={['academic_years.read']} />}>
                <Route path="/academic/years" element={<AcademicYears />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['semesters.read']} />}>
                <Route path="/academic/semesters" element={<Semesters />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['grades.read']} />}>
                <Route path="/academic/grades" element={<Grades />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['majors.read']} />}>
                <Route path="/academic/majors" element={<Majors />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['classrooms.read']} />}>
                <Route path="/academic/classrooms" element={<Classrooms />} />
                <Route path="/academic/classrooms/:id" element={<ClassroomDetail />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['subjects.read']} />}>
                <Route path="/academic/subjects" element={<Subjects />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['class_periods.read']} />}>
                <Route path="/academic/class-periods" element={<ClassPeriods />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['schedules.read']} />}>
                <Route path="/academic/schedules" element={<Schedules />} />
              </Route>
              
              {/* Kenaikan & Kelulusan */}
              <Route element={<AuthorizedRoute requiredPermissions={['promotions.read']} />}>
                <Route path="/academic/promotions" element={<Promotions />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['promotions.execute']} />}>
                <Route path="/academic/promotions/batch" element={<BatchPromote />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['graduations.read']} />}>
                <Route path="/academic/graduations" element={<Graduations />} />
              </Route>

              {/* Sistem, RBAC & Akun */}
              <Route element={<AuthorizedRoute requiredPermissions={['roles.read', 'roles.manage']} />}>
                <Route path="/admin/permissions" element={<Permissions />} />
                <Route path="/admin/roles" element={<Roles />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['users.read', 'users.create', 'users.update']} />}>
                <Route path="/admin/users" element={<Users />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['school_profile.read', 'school_profile.update']} />}>
                <Route path="/profile/school" element={<SchoolProfilePage />} />
              </Route>

              {/* SDM / Kepegawaian */}
              <Route element={<AuthorizedRoute requiredPermissions={['positions.read']} />}>
                <Route path="/entities/positions" element={<Positions />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['employees.read']} />}>
                <Route path="/entities/employees" element={<Employees />} />
              </Route>

              {/* Kesiswaan */}
              <Route element={<AuthorizedRoute requiredPermissions={['students.read']} />}>
                <Route path="/entities/students" element={<Students />} />
                <Route path="/entities/students/:id" element={<StudentDetail />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['achievements.read', 'achievements.create_assigned', 'achievements.create_all', 'achievements.create', 'students.read']} />}>
                <Route path="/student-affairs/achievements" element={<Achievements />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['violations.read', 'violations.create_assigned', 'violations.create_all', 'violations.create', 'students.read']} />}>
                <Route path="/student-affairs/violations" element={<Violations />} />
              </Route>

              {/* Presensi */}
              <Route element={<AuthorizedRoute requiredPermissions={['attendance_settings.manage']} />}>
                <Route path="/attendance/settings" element={<AttendanceSettings />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['student_attendance.read', 'student_attendance.record']} />}>
                <Route path="/attendance/students" element={<StudentAttendancePage />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['employee_attendance.read', 'employee_attendance.record']} />}>
                <Route path="/attendance/employees" element={<EmployeeAttendancePage />} />
              </Route>

              {/* Penilaian & Rapor */}
              <Route element={<AuthorizedRoute requiredPermissions={['assessment_components.read', 'assessment_components.manage']} />}>
                <Route path="/assessment/components" element={<AssessmentComponents />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['assessments.read', 'assessments.input']} />}>
                <Route path="/assessment/exams" element={<Exams />} />
                <Route path="/assessment/exams/:examId/scores" element={<ExamScores />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['report_cards.read', 'report_cards.generate']} />}>
                <Route path="/assessment/report-cards" element={<ReportCards />} />
              </Route>

              {/* Persuratan & Komunikasi */}
              <Route element={<AuthorizedRoute requiredPermissions={['announcements.read', 'announcements.create']} />}>
                <Route path="/announcements" element={<Announcements />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['incoming_letters.read', 'incoming_letters.create']} />}>
                <Route path="/letters/incoming" element={<IncomingLetters />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['outgoing_letters.read', 'outgoing_letters.create']} />}>
                <Route path="/letters/outgoing" element={<OutgoingLetters />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['letter_templates.read', 'letter_templates.manage']} />}>
                <Route path="/letters/templates" element={<LetterTemplates />} />
              </Route>

              {/* Hardware / Perangkat */}
              <Route element={<AuthorizedRoute requiredPermissions={['hardware.read_logs']} />}>
                <Route path="/hardware/logs" element={<HardwareLogs />} />
              </Route>
              <Route element={<AuthorizedRoute requiredPermissions={['hardware.assign_card']} />}>
                <Route path="/hardware/registration" element={<IdentityRegistration />} />
              </Route>

              <Route path="/settings" element={<AccountSettings />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            <Route path="/student" element={<StudentLayout />}>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="grades" element={<StudentGrades />} />
              <Route path="discipline" element={<StudentDiscipline />} />
            </Route>

          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

