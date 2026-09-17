# Achievements & Violations UI Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize the UI of `Achievements.tsx` and `Violations.tsx` to align with the modern design system (DataTable, ActionButtons, Pagination, ConfirmDialog, and notify toast).

**Architecture:** Refactor `Achievements.tsx` and `Violations.tsx` in `frontend/src/pages/StudentAffairs/` to consume shared UI components from `@/components/ui`, `@/components/Common`, and `@/utils/feedback`. Eliminate legacy `useDialog` and inline alert banners.

**Tech Stack:** React, TypeScript, TailwindCSS, Lucide React, Vite.

## Global Constraints
- Do NOT use native `window.alert()` or `window.confirm()`.
- Do NOT add new KPI summary cards (keep user requested scope: focus penataan tampilan saja).
- Maintain 0 TypeScript compilation errors (`npx tsc --noEmit`).

---

### Task 1: Standardize `Achievements.tsx`

**Files:**
- Modify: `frontend/src/pages/StudentAffairs/Achievements.tsx`

**Interfaces:**
- Consumes:
  - `DataTable`, `type Column` from `../../components/Common/DataTable`
  - `ActionButtons` from `../../components/Common/ActionButtons`
  - `Pagination` from `../../components/Common/Pagination`
  - `ConfirmDialog` from `../../components/ui/ConfirmDialog`
  - `PageHeader`, `Modal`, `FormField`, `Badge` from `../../components/ui`
  - `notify` from `../../utils/feedback`
  - `getAchievements`, `createAchievement`, `updateAchievement`, `deleteAchievement` from `../../api/studentAffairsService`

- [ ] **Step 1: Refactor `Achievements.tsx` to replace `useDialog` and inline alerts with `ConfirmDialog` and `notify`**
- [ ] **Step 2: Replace raw table with `<DataTable<Achievement> />`, `<ActionButtons />`, and `<Pagination />`**
- [ ] **Step 3: Update student selection in `<Modal />` with clean debounced dropdown and chip selector**
- [ ] **Step 4: Verify TypeScript compilation passes**

Run: `cd frontend && npx tsc --noEmit`
Expected: Exit code 0

---

### Task 2: Standardize `Violations.tsx`

**Files:**
- Modify: `frontend/src/pages/StudentAffairs/Violations.tsx`

**Interfaces:**
- Consumes:
  - `DataTable`, `type Column` from `../../components/Common/DataTable`
  - `ActionButtons` from `../../components/Common/ActionButtons`
  - `Pagination` from `../../components/Common/Pagination`
  - `ConfirmDialog` from `../../components/ui/ConfirmDialog`
  - `PageHeader`, `Modal`, `FormField`, `Badge` from `../../components/ui`
  - `notify` from `../../utils/feedback`
  - `getViolations`, `createViolation`, `updateViolation`, `deleteViolation`, `getViolationTypes` from `../../api/studentAffairsService`

- [ ] **Step 1: Refactor `Violations.tsx` to replace `useDialog` and inline alerts with `ConfirmDialog` and `notify`**
- [ ] **Step 2: Replace raw table with `<DataTable<Violation> />`, `<ActionButtons />`, and `<Pagination />`**
- [ ] **Step 3: Update student selection and category selection in `<Modal />`**
- [ ] **Step 4: Verify TypeScript compilation passes**

Run: `cd frontend && npx tsc --noEmit`
Expected: Exit code 0

---

### Task 3: Full Verification & Quality Assurance

**Files:**
- Verify: `frontend/src/pages/StudentAffairs/Achievements.tsx`
- Verify: `frontend/src/pages/StudentAffairs/Violations.tsx`

- [ ] **Step 1: Run frontend TypeScript verification**
Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run backend tests for achievements-violations module**
Run: `cd backend && npm test -- achievements-violations`
Expected: All suites pass
