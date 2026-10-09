// @ts-nocheck
import { Router } from "express";
import type { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { checkAuth, checkRoleAdmin } from "../middlewares/authMiddleware";
import { zStudentPostBody, zStudentPutBody, zStudentId } from "../lib/zodValidators";
import { z } from "zod";

const router = Router();

router.get("/", checkAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await prisma.student.findMany();
    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
});

router.post("/", checkAuth, checkRoleAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = zStudentPostBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้องตามรูปแบบ",
        errors: parseResult.error.flatten(),
      });
      return;
    }

    const { studentId, firstName, lastName, program, interests, emails } = parseResult.data;

    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    });

    if (existingStudent) {
      res.status(409).json({
        success: false,
        message: "รหัสนักศึกษานี้มีอยู่ในระบบแล้ว",
      });
      return;
    }

    const newStudent = await prisma.student.create({
      data: {
        studentId,
        firstName,
        lastName,
        program,
        interests,
        emails,
      },
    });

    res.status(201).json({
      success: true,
      message: "เพิ่มนักศึกษาสำเร็จ",
      data: newStudent,
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
    const parseResult = zStudentPutBody.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "ข้อมูลไม่ถูกต้องตามรูปแบบ",
        errors: parseResult.error.flatten(),
      });
      return;
    }

    const { studentId, firstName, lastName, program, interests, emails } = parseResult.data;
    const user = (req as any).user;

    if (user?.role !== "ADMIN" && user?.studentId !== studentId) {
      res.status(403).json({
        success: false,
        message: "คุณไม่มีสิทธิ์แก้ไขข้อมูลของนักศึกษาท่านนี้",
      });
      return;
    }

    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    });

    if (!existingStudent) {
      res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลนักศึกษา",
      });
      return;
    }

    const updateData: any = {};
    if (firstName !== null && firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== null && lastName !== undefined) updateData.lastName = lastName;
    if (program !== null && program !== undefined) updateData.program = program;
    if (interests !== null && interests !== undefined) updateData.interests = interests;
    if (emails !== null && emails !== undefined) updateData.emails = emails;

    const updatedStudent = await prisma.student.update({
      where: { studentId },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "แก้ไขข้อมูลนักศึกษาสำเร็จ",
      data: updatedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
});

router.delete("/", checkAuth, checkRoleAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = z.object({ studentId: zStudentId }).safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: "กรุณาระบุรหัสนักศึกษาที่ต้องการลบ",
      });
      return;
    }

    const { studentId } = parseResult.data;

    const existingStudent = await prisma.student.findUnique({
      where: { studentId },
    });

    if (!existingStudent) {
      res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลนักศึกษา",
      });
      return;
    }

    const [deletedEnrollments, deletedStudent] = await prisma.$transaction([
      prisma.enrollment.deleteMany({
        where: { studentId },
      }),
      prisma.student.delete({
        where: { studentId },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "ลบนักศึกษาและการลงทะเบียนสำเร็จ",
      data: deletedStudent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
});

export default router;