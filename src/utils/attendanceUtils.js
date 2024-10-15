import { addDoc, collection, query, where, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const recordLessonView = async (studentId, classId, lessonId, duration) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceQuery = query(
    collection(db, 'Attendances'),
    where('studentId', '==', studentId),
    where('classId', '==', classId),
    where('date', '>=', today),
    where('activityType', '==', 'lesson_view'),
    where('activityId', '==', lessonId)
  );

  const querySnapshot = await getDocs(attendanceQuery);

  if (querySnapshot.empty) {
    // บันทึกการเข้าดูบทเรียนใหม่
    await addDoc(collection(db, 'Attendances'), {
      studentId,
      classId,
      date: serverTimestamp(),
      activityType: 'lesson_view',
      activityId: lessonId,
      duration: duration
    });
  } else {
    // อัปเดตระยะเวลาการดูบทเรียนที่มีอยู่แล้ว
    const existingAttendance = querySnapshot.docs[0];
    await updateDoc(existingAttendance.ref, {
      duration: existingAttendance.data().duration + duration
    });
  }
};

export const recordQuizAttempt = async (studentId, classId, quizId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceQuery = query(
    collection(db, 'Attendances'),
    where('studentId', '==', studentId),
    where('classId', '==', classId),
    where('date', '>=', today),
    where('activityType', '==', 'quiz_attempt'),
    where('activityId', '==', quizId)
  );

  const querySnapshot = await getDocs(attendanceQuery);

  if (querySnapshot.empty) {
    await addDoc(collection(db, 'Attendances'), {
      studentId,
      classId,
      date: serverTimestamp(),
      activityType: 'quiz_attempt',
      activityId: quizId
    });
  }
};