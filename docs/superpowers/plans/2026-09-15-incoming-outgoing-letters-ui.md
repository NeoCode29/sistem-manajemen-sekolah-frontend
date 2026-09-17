# Incoming & Outgoing Letters UI Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize `IncomingLetters.tsx` and `OutgoingLetters.tsx` with DataTable, ActionButtons, Pagination, ConfirmDialog, and notify toast.

**Architecture:** Refactor both pages in `frontend/src/pages/Letters/` to consume standard shared UI components, eliminating legacy `useDialog` and inline alerts.

**Tech Stack:** React, TypeScript, TailwindCSS, Lucide React, Vite.

## Global Constraints
- Do NOT use native `window.alert()` or `window.confirm()`.
- Maintain 0 TypeScript compilation errors (`npx tsc --noEmit`).

---

### Task 1: Standardize `IncomingLetters.tsx`

**Files:**
- Modify: `frontend/src/pages/Letters/IncomingLetters.tsx`

**Interfaces:**
- Consumes:
  - `DataTable`, `type Column` from `../../components/Common/DataTable`
  - `ActionButtons` from `../../components/Common/ActionButtons`
  - `Pagination` from `../../components/Common/Pagination`
  - `ConfirmDialog` from `../../components/ui/ConfirmDialog`
  - `PageHeader`, `Modal`, `FormField` from `../../components/ui`
  - `notify` from `../../utils/feedback`
  - `getIncomingLetters`, `createIncomingLetter`, `updateIncomingLetter`, `deleteIncomingLetter`, `uploadIncomingLetterFile` from `../../api/letterService`

- [ ] **Step 1: Replace legacy `useDialog` with `ConfirmDialog` and toast `notify`**
- [ ] **Step 2: Add instant search bar and `<Pagination />`**
- [ ] **Step 3: Update `<DataTable />` columns and integrate `<ActionButtons />`**
- [ ] **Step 4: Clean up modal form error handling and file attachment upload**
- [ ] **Step 5: Verify TypeScript compilation passes**

Run: `cd frontend && npx tsc --noEmit`
Expected: Exit code 0

---

### Task 2: Standardize `OutgoingLetters.tsx`

**Files:**
- Modify: `frontend/src/pages/Letters/OutgoingLetters.tsx`

**Interfaces:**
- Consumes:
  - `DataTable`, `type Column` from `../../components/Common/DataTable`
  - `ActionButtons` from `../../components/Common/ActionButtons`
  - `Pagination` from `../../components/Common/Pagination`
  - `ConfirmDialog` from `../../components/ui/ConfirmDialog`
  - `PageHeader`, `Modal`, `FormField` from `../../components/ui`
  - `notify` from `../../utils/feedback`
  - `getOutgoingLetters`, `createOutgoingLetter`, `updateOutgoingLetter`, `deleteOutgoingLetter` from `../../api/letterService`

- [ ] **Step 1: Replace legacy `useDialog` with `ConfirmDialog` and toast `notify`**
- [ ] **Step 2: Add instant search bar and `<Pagination />`**
- [ ] **Step 3: Update `<DataTable />` columns and integrate `<ActionButtons />`**
- [ ] **Step 4: Clean up modal form error handling and file attachment upload**
- [ ] **Step 5: Verify TypeScript compilation passes**

Run: `cd frontend && npx tsc --noEmit`
Expected: Exit code 0

---

### Task 3: Full Verification & Quality Assurance

- [ ] **Step 1: Run frontend type check**
Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run backend tests for letters**
Run: `cd backend && npm test -- letters`
Expected: All suites pass
