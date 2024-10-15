import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Spinner } from 'react-bootstrap';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AttendanceReport = ({ classId }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentNames, setStudentNames] = useState({});

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const attendanceQuery = query(
          collection(db, 'Attendances'),
          where('classId', '==', classId)
        );
        const querySnapshot = await getDocs(attendanceQuery);
        const data = querySnapshot.docs.map(doc => doc.data());
        setAttendanceData(data);

        // Fetch student names
        const studentIds = [...new Set(data.map(record => record.studentId))];
        const names = await fetchStudentNames(studentIds);
        setStudentNames(names);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [classId]);

  const fetchStudentNames = async (studentIds) => {
    const names = {};
    for (const id of studentIds) {
      const studentDoc = await getDoc(doc(db, 'Students', id));
      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        names[id] = `${studentData.FirstName} ${studentData.LastName}`;
      }
    }
    return names;
  };

  const getOverviewData = () => {
    const overview = {
      totalLessonViews: 0,
      totalQuizAttempts: 0,
      averageLessonDuration: 0
    };

    attendanceData.forEach(record => {
      if (record.activityType === 'lesson_view') {
        overview.totalLessonViews++;
        overview.averageLessonDuration += record.duration || 0;
      } else if (record.activityType === 'quiz_attempt') {
        overview.totalQuizAttempts++;
      }
    });

    if (overview.totalLessonViews > 0) {
      overview.averageLessonDuration /= overview.totalLessonViews;
    }

    return overview;
  };

  const getChartData = () => {
    const chartData = attendanceData.reduce((acc, record) => {
      const date = record.date.toDate().toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { date, lessonViews: 0, quizAttempts: 0 };
      }
      if (record.activityType === 'lesson_view') {
        acc[date].lessonViews++;
      } else if (record.activityType === 'quiz_attempt') {
        acc[date].quizAttempts++;
      }
      return acc;
    }, {});

    return Object.values(chartData);
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </Spinner>
      </Container>
    );
  }

  const overviewData = getOverviewData();
  const chartData = getChartData();


  return (
    <Container className="mt-4">
      <h2 className="mb-4">รายงานการเข้าชั้นเรียน</h2>
      
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>จำนวนการเข้าชมบทเรียน</Card.Title>
              <Card.Text className="display-4">{overviewData.totalLessonViews}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>จำนวนการทำแบบทดสอบ</Card.Title>
              <Card.Text className="display-4">{overviewData.totalQuizAttempts}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>เวลาเฉลี่ยในการดูบทเรียน</Card.Title>
              <Card.Text className="display-4">{overviewData.averageLessonDuration.toFixed(2)} นาที</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>แนวโน้มการเข้าชั้นเรียน</Card.Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="lessonViews" name="การเข้าชมบทเรียน" fill="#8884d8" />
              <Bar dataKey="quizAttempts" name="การทำแบบทดสอบ" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>รายละเอียดการเข้าชั้นเรียน</Card.Title>
          <Table responsive>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>ประเภทกิจกรรม</th>
                <th>ชื่อ-สกุลนักเรียน</th>
                <th>ระยะเวลา (นาที)</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record, index) => (
                <tr key={index}>
                  <td>{record.date.toDate().toLocaleString()}</td>
                  <td>{record.activityType === 'lesson_view' ? 'เข้าชมบทเรียน' : 'ทำแบบทดสอบ'}</td>
                  <td>{studentNames[record.studentId] || 'ไม่พบข้อมูล'}</td>
                  <td>{record.duration ? record.duration.toFixed(2) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AttendanceReport;