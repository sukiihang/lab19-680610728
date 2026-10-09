import { create } from "zustand";
import { api } from "./api";

export interface StudentFormInput {
  studentId: string;
  firstName: string;
  lastName: string;
  program: string;
  interests: string[];
  emails: { address: string }[];
}

export interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  program: string;
  interests: string[];
  emails: string[];
}

export interface Course {
  courseId: string;
  courseName: string;
  instructors: string[];
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
  updateEnrollment: (studentId: string, courseId: string, newCourseId: string) => Promise<void>;
  dropEnrollment: (studentId: string, courseId: string) => Promise<void>;
}

export const useEnrollmentStore = create<EnrollmentState>((set, get) => ({
  students: [],
  courses: [],
  enrollments: [],

  fetchData: async () => {
    const [resStudents, resCourses, resEnrollments] = await Promise.all([
      api.get("/students"),
      api.get("/courses"),
      api.get("/enrollments"),
    ]);
    set({
      students: resStudents.data.data,
      courses: resCourses.data.data,
      enrollments: resEnrollments.data.data,
    });
  },

  addStudent: async (input: StudentFormInput) => {
    const payload = {
      ...input,
      emails: input.emails.map((e) => e.address).filter(Boolean),
    };
    const res = await api.post("/students", payload);
    const newStudent = res.data.data;
    set((state) => ({
      students: [...state.students, newStudent],
    }));
  },

  updateStudent: async (input: StudentFormInput) => {
    const payload = {
      ...input,
      emails: input.emails.map((e) => e.address).filter(Boolean),
    };
    const res = await api.put("/students", payload);
    const updatedStudent = res.data.data;
    set((state) => ({
      students: state.students.map((s) =>
        s.studentId === updatedStudent.studentId ? updatedStudent : s
      ),
    }));
  },

  removeStudent: async (studentId: string) => {
    await api.delete("/students", { data: { studentId } });
    set((state) => ({
      students: state.students.filter((s) => s.studentId !== studentId),
      enrollments: state.enrollments.filter((e) => e.studentId !== studentId),
    }));
  },

  updateEnrollment: async (studentId: string, courseId: string, newCourseId: string) => {
    const res = await api.put("/enrollments", {
      studentId,
      courseId,
      newCourseId,
    });
    const updatedEnrollment = res.data.data;
    set((state) => ({
      enrollments: state.enrollments.map((e) =>
        e.studentId === studentId && e.courseId === courseId
          ? updatedEnrollment
          : e
      ),
    }));
  },

  dropEnrollment: async (studentId: string, courseId: string) => {
    await api.delete("/enrollments", {
      data: { studentId, courseId },
    });
    set((state) => ({
      enrollments: state.enrollments.filter(
        (e) => !(e.studentId === studentId && e.courseId === courseId)
      ),
    }));
  },
}));