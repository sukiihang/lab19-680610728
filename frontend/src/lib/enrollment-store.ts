// @ts-nocheck
import { create } from "zustand";
import { api } from "./api";
import type { Course, Student, Enrollment } from "./types";

export interface StudentFormInput {
  studentId: string;
  firstName: string;
  lastName: string;
  program: "CPE" | "ISNE";
  interests: string[];
  emails: { address: string }[];
}

export function fromApiStudent(apiStudent: any): Student {
  return {
    ...apiStudent,
    emails: Array.isArray(apiStudent.emails)
      ? apiStudent.emails.map((e: any) =>
          typeof e === "string" ? { address: e } : e
        )
      : [],
  };
}

export function toApiStudent(input: StudentFormInput | Student) {
  return {
    ...input,
    emails: input.emails
      .map((e: any) => (typeof e === "string" ? e : e?.address))
      .filter(Boolean),
  };
}

interface EnrollmentState {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  loading: boolean;
  error: string | null;

  getAll: () => Promise<void>;
  reset: () => void;
  fetchData: () => Promise<void>;

  addCourse: (course: Course) => Promise<void>;
  updateCourse: (course: Course) => Promise<void>;
  removeCourse: (courseId: string) => Promise<void>;

  addStudent: (input: StudentFormInput) => Promise<void>;
  updateStudent: (input: StudentFormInput) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;

  enroll: (studentId: string, courseId: string) => Promise<void>;
  updateEnrollment: (studentId: string, courseId: string, newCourseId: string) => Promise<void>;
  dropEnrollment: (studentId: string, courseId: string) => Promise<void>;
}

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  students: [],
  courses: [],
  enrollments: [],
  loading: false,
  error: null,

  reset: () => set({ students: [], courses: [], enrollments: [], loading: false, error: null }),

  getAll: async () => {
    set({ loading: true, error: null });
    try {
      const [resStudents, resCourses, resEnrollments] = await Promise.all([
        api<any>("/students", { method: "GET" }),
        api<any>("/courses", { method: "GET" }),
        api<any>("/enrollments", { method: "GET" }),
      ]);

      const rawStudents = resStudents?.data ?? resStudents ?? [];
      const students = Array.isArray(rawStudents) ? rawStudents.map(fromApiStudent) : [];

      set({
        students,
        courses: resCourses?.data ?? resCourses ?? [],
        enrollments: resEnrollments?.data ?? resEnrollments ?? [],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err?.message || "Failed to fetch data", loading: false });
    }
  },

  fetchData: async () => {
    await get().getAll();
  },

  addCourse: async (course: Course) => {
    const res = await api<any>("/courses", { method: "POST", body: course });
    const newCourse = res?.data ?? res;
    set((state) => ({ courses: [...state.courses, newCourse] }));
  },

  updateCourse: async (course: Course) => {
    const res = await api<any>("/courses", { method: "PUT", body: course });
    const updated = res?.data ?? res;
    set((state) => ({
      courses: state.courses.map((c) => (c.courseId === updated.courseId ? updated : c)),
    }));
  },

  removeCourse: async (courseId: string) => {
    await api<any>("/courses", { method: "DELETE", body: { courseId } });
    set((state) => ({
      courses: state.courses.filter((c) => c.courseId !== courseId),
    }));
  },

  addStudent: async (input: StudentFormInput) => {
    const payload = toApiStudent(input);
    const res = await api<any>("/students", { method: "POST", body: payload });
    const newStudent = fromApiStudent(res?.data ?? res);
    set((state) => ({ students: [...state.students, newStudent] }));
  },

  updateStudent: async (input: StudentFormInput) => {
    const payload = toApiStudent(input);
    const res = await api<any>("/students", { method: "PUT", body: payload });
    const updatedStudent = fromApiStudent(res?.data ?? res);
    set((state) => ({
      students: state.students.map((s) =>
        s.studentId === updatedStudent.studentId ? updatedStudent : s
      ),
    }));
  },

  removeStudent: async (studentId: string) => {
    await api<any>("/students", { method: "DELETE", body: { studentId } });
    set((state) => ({
      students: state.students.filter((s) => s.studentId !== studentId),
      enrollments: state.enrollments.filter((e) => e.studentId !== studentId),
    }));
  },

  enroll: async (studentId: string, courseId: string) => {
    const res = await api<any>("/enrollments", {
      method: "POST",
      body: { studentId, courseId },
    });
    const newEnrollment = res?.data ?? res;
    set((state) => ({ enrollments: [...state.enrollments, newEnrollment] }));
  },

  updateEnrollment: async (studentId: string, courseId: string, newCourseId: string) => {
    const res = await api<any>("/enrollments", {
      method: "PUT",
      body: { studentId, courseId, newCourseId },
    });
    const updatedEnrollment = res?.data ?? res;
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.studentId === studentId && e.courseId === courseId ? updatedEnrollment : e
      ),
    }));
  },

  dropEnrollment: async (studentId: string, courseId: string) => {
    await api<any>("/enrollments", {
      method: "DELETE",
      body: { studentId, courseId },
    });
    set((state) => ({
      enrollments: state.enrollments.filter(
        (e) => !(e.studentId === studentId && e.courseId === courseId)
      ),
    }));
  },
}));