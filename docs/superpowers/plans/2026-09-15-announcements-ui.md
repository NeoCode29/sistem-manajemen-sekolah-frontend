# Announcements UI Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize `Announcements.tsx` with DataTable, ActionButtons, Pagination, ConfirmDialog, and notify toast.

**Architecture:** Refactor `frontend/src/pages/Announcements/Announcements.tsx` to consume the system's standard components, eliminating `useDialog` and inline alert banners.

**Tech Stack:** React, TypeScript, TailwindCSS, Lucide React, Vite.

## Global Constraints
- Do NOT use native `window.alert()` or `window.confirm()`.
- Maintain 0 TypeScript compilation errors (`npx tsc --noEmit`).

---

### Task 1: Standardize `Announcements.tsx`

**Files:**
- Modify: `frontend/src/pages/Announcements/Announcements.tsx`

**Interfaces:**
- Consumes:
  - `DataTable`, `type Column` from `../../components/Common/DataTable`
  - `ActionButtons` from `../../components/Common/ActionButtons`
  - `Pagination` from `../../components/Common/Pagination`
  - `ConfirmDialog` from `../../components/ui/ConfirmDialog`
  - `PageHeader`, `Modal`, `FormField`, `Badge` from `../../components/ui`
  - `notify` from `../../utils/feedback`
  - `getAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` from `../../api/announcementService`

- [ ] **Step 1: Replace legacy `useDialog` with `ConfirmDialog` and toast `notify`**
- [ ] **Step 2: Add instant search bar and `<Pagination />`**
- [ ] **Step 3: Update `<DataTable />` columns and integrate `<ActionButtons />`**
- [ ] **Step 4: Clean up modal form error handling with `notify.error`**
- [ ] **Step 5: Verify TypeScript compilation passes**

Run: `cd frontend && npx tsc --noEmit`
Expected: Exit code 0

---

### Task 2: Verification

- [ ] **Step 1: Run frontend type check**
Run: `cd frontend && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Run backend tests for letters and announcements**
Run: `cd backend && npm test -- announcements`
Expected: All suites pass
