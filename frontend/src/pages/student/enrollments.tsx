// @ts-nocheck
import { useState } from "react";
import { useEnrollmentStore } from "@/lib/enrollment-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft, Trash2 } from "lucide-react";

export default function StudentEnrollmentsPage() {
  const { enrollments, courses, updateEnrollment, dropEnrollment } = useEnrollmentStore();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const studentId = "680610001";

  const studentEnrollments = enrollments.filter((e) => e.studentId === studentId);
  const enrolledCourseIds = studentEnrollments.map((e) => e.courseId);
  const availableCourses = courses.filter((c) => !enrolledCourseIds.includes(c.courseId));

  const handleDrop = async (courseId: string) => {
    setGlobalError(null);
    try {
      await dropEnrollment(studentId, courseId);
    } catch (err: any) {
      setGlobalError(err?.response?.data?.message || err?.message || "ไม่สามารถยกเลิกการลงทะเบียนได้");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">จัดการการลงทะเบียน</h1>

      {globalError && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm border border-red-200">
          {globalError}
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b bg-gray-50 text-sm font-semibold">
              <th className="p-3">รหัสวิชา</th>
              <th className="p-3">ชื่อวิชา</th>
              <th className="p-3">ผู้สอน</th>
              <th className="p-3">วันที่ลงทะเบียน</th>
              <th className="p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {studentEnrollments.map((item) => (
              <tr key={item.courseId} className="border-b hover:bg-gray-50 text-sm">
                <td className="p-3">{item.courseId}</td>
                <td className="p-3">{item.course?.courseTitle || item.course?.courseName || "-"}</td>
                <td className="p-3">{item.course?.instructors?.join(", ") || "-"}</td>
                <td className="p-3">{item.createdAt || "-"}</td>
                <td className="p-3 text-center space-x-2">
                  <ChangeCourseDialog
                    studentId={studentId}
                    currentCourseId={item.courseId}
                    availableCourses={availableCourses}
                    onUpdate={updateEnrollment}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm(`ต้องการยกเลิกการลงทะเบียนวิชา ${item.courseId} ใช่หรือไม่?`)) {
                        handleDrop(item.courseId);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ChangeCourseDialogProps {
  studentId: string;
  currentCourseId: string;
  availableCourses: any[];
  onUpdate: (studentId: string, courseId: string, newCourseId: string) => Promise<void>;
}

function ChangeCourseDialog({
  studentId,
  currentCourseId,
  availableCourses,
  onUpdate,
}: ChangeCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedCourseId) return;
    setDialogError(null);

    try {
      await onUpdate(studentId, currentCourseId, selectedCourseId);
      setOpen(false);
      setSelectedCourseId("");
    } catch (err: any) {
      setDialogError(err?.response?.data?.message || err?.message || "เกิดข้อผิดพลาดในการเปลี่ยนวิชา");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="ghost" size="icon">
          <ArrowRightLeft className="w-4 h-4 text-gray-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เปลี่ยนวิชา {currentCourseId}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500">
          เลือกวิชาใหม่แทนวิชา {currentCourseId} (เลือกได้เฉพาะวิชาที่ยังไม่ได้ลงทะเบียน)
        </p>

        {dialogError && (
          <div className="p-2 bg-red-100 text-red-700 rounded text-xs">
            {dialogError}
          </div>
        )}

        <div className="space-y-2 py-2">
          <label className="text-sm font-medium">วิชาใหม่</label>
          <Select value={selectedCourseId} onValueChange={(val: any) => setSelectedCourseId(val || "")}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกวิชา" />
            </SelectTrigger>
            <SelectContent>
              {availableCourses.map((c) => (
                <SelectItem key={c.courseId} value={c.courseId}>
                  {c.courseId} {c.courseTitle || c.courseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={handleSubmit}
            disabled={!selectedCourseId}
            className="flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}