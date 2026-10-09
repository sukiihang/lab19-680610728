import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { checkAuth } from "../middlewares/authMiddleware.js";
import { zEnrollmentBody, zEnrollmentPutBody } from "../lib/zodValidators.js";

const router = Router();

router.get("/", checkAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      include: {
        course: true,
        student: true,
      },
    });
    res.status(200).json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
});

router.post("/", checkAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = zEnrollmentBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้องตามรูปแบบ",
        errors: parseResult.error.flatten(),
      });
      return;
    }

    const { studentId, courseId } = parseResult.data;
    const user = (req as any).user;

    if (user?.role !== "ADMIN" && user?.studentId !== studentId) {
      res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์ลงทะเบียนให้นักศึกษาท่านนี้",
      });
      return;
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      res.status(409).json({
        success: false,
        message: "ลงทะเบียนวิชานี้ไว้แล้ว",
      });
      return;
    }

    const course = await prisma.course.findUnique({
      where: { courseId },
    });

    if (!course) {
      res.status(404).json({
        success: false,
        message: "ไม่พบวิชาเรียน",
      });
      return;
    }

    const newEnrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
      },
      include: {
        course: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "ลงทะเบียนสำเร็จ",
      data: newEnrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
});

router.put("/", checkAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = zEnrollmentPutBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้องตามรูปแบบ",
        errors: parseResult.error.flatten(),
      });
      return;
    }

    const { studentId, courseId, newCourseId } = parseResult.data;
    const user = (req as any).user;

    if (user?.role !== "ADMIN" && user?.studentId !== studentId) {
      res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์แก้ไขการลงทะเบียนของนักศึกษาคนนี้",
      });
      return;
    }

    if (courseId === newCourseId) {
      res.status(400).json({
        success: false,
        message: "วิชาใหม่ต้องไม่เหมือนวิชาเดิม",
      });
      return;
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (!existingEnrollment) {
      res.status(404).json({
        success: false,
        message: "ยังไม่ได้ลงวิชาเดิม",
      });
      return;
    }

    const newCourse = await prisma.course.findUnique({
      where: { courseId: newCourseId },
    });

    if (!newCourse) {
      res.status(404).json({
        success: false,
        message: "วิชาใหม่ไม่มีจริง",
      });
      return;
    }

    const alreadyEnrolledNewCourse = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId: newCourseId,
        },
      },
    });

    if (alreadyEnrolledNewCourse) {
      res.status(409).json({
        success: false,
        message: "ลงทะเบียนวิชาใหม่ไว้แล้ว",
      });
      return;
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      data: {
        courseId: newCourseId,
      },
      include: {
        course: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "เปลี่ยนวิชาสำเร็จ",
      data: updatedEnrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
});

router.delete("/", checkAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = zEnrollmentBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้องตามรูปแบบ",
      });
      return;
    }

    const { studentId, courseId } = parseResult.data;
    const user = (req as any).user;

    if (user?.role !== "ADMIN" && user?.studentId !== studentId) {
      res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์ยกเลิกการลงทะเบียนของนักศึกษาคนนี้",
      });
      return;
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (!existingEnrollment) {
      res.status(404).json({
        success: false,
        message: "ไม่พบการลงทะเบียน",
      });
      return;
    }

    const deletedEnrollment = await prisma.enrollment.delete({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "ยกเลิกการลงทะเบียนสำเร็จ",
      data: deletedEnrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
});

export default router;