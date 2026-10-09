import { create } from "zustand";
import { api } from "./api";

export interface StudentFormInput {
  studentId: string;
  firstName: string;
  lastName: string;
  program: "CPE" | "ISNE";
  interests: string[];
  emails: { address: string }[];
}

export interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  program: "CPE" | "ISNE";
  interests: string[];
  emails: string[];
}

export interface Course {
  courseId: string;
  courseTitle?: string;
  courseName?: string;
  instructors?: string[];
}

export interface Enrollment {
  studentId: string;
  courseId: string;
  createdAt?: string;
  course?: Course;
  student?: Student;
}

interface EnrollmentState {
  students: Student[];
  courses: Course[];
  enrollments: Enrollment[];
  fetchData: () => Promise<void>;
  addStudent: (input: StudentFormInput) => Promise<void>;
  updateStudent: (input: StudentFormInput) => Promise<void>;
  removeStudent: (studentId: string) => Promise<void>;
  enroll: (studentId: string, courseId: string) => Promise<void>;
  updateEnrollment: (studentId: string, courseId: string, newCourseId: string) => Promise<void>;
  dropEnrollment: (studentId: string, courseId: string) => Promise<void>;
}

export const useEnrollmentStore = create<EnrollmentState>((set) => ({
  students: [],
  courses: [],
  enrollments: [],

  fetchData: async () => {
    const [resStudents, resCourses, resEnrollments] = await Promise.all([
      api<any>("/students", { method: "GET" }),
      api<any>("/courses", { method: "GET" }),
      api<any>("/enrollments", { method: "GET" }),
    ]);
    set({
      students: resStudents?.data ?? resStudents ?? [],
      courses: resCourses?.data ?? resCourses ?? [],
      enrollments: resEnrollments?.data ?? resEnrollments ?? [],
    });
  },

  addStudent: async (input: StudentFormInput) => {
    const payload = {
      ...input,
      emails: input.emails.map((e) => e.address).filter(Boolean),
    };
    const res = await api<any>("/students", { method: "POST", body: payload });
    const newStudent = res?.data ?? res;
    set((state) => ({
      students: [...state.students, newStudent],
    }));
  },

  updateStudent: async (input: StudentFormInput) => {
    const payload = {
      ...input,
      emails: input.emails.map((e) => e.address).filter(Boolean),
    };
    const res = await api<any>("/students", { method: "PUT", body: payload });
    const updatedStudent = res?.data ?? res;
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
    set((state) => ({
      enrollments: [...state.enrollments, newEnrollment],
    }));
  },

  updateEnrollment: async (studentId: string, courseId: string, newCourseId: string) => {
    const res = await api<any>("/enrollments", {
      method: "PUT",
      body: { studentId, courseId, newCourseId },
    });
    const updatedEnrollment = res?.data ?? res;
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.studentId === studentId && e.courseId === courseId
          ? updatedEnrollment
          : e
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