import React, { useState } from 'react';
import { Modal, Table, Button } from 'react-bootstrap';

const StudentListModal = ({ show, onHide, students, onRemoveStudent }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleRemoveClick = (student) => {
    setStudentToRemove(student);
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = () => {
    if (studentToRemove && onRemoveStudent) {
      onRemoveStudent(studentToRemove.id);
    }
    setShowConfirmModal(false);
    setStudentToRemove(null);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>รายชื่อนักเรียนในห้องเรียน</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>ชื่อ</th>
                <th>นามสกุล</th>
                <th>Username</th>
                <th>อีเมล</th>
                <th>วันที่ลงทะเบียน</th>
                <th>นำออก</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.id}>
                  <td>{index + 1}</td>
                  <td>{student.FirstName}</td>
                  <td>{student.LastName}</td>
                  <td>{student.Username}</td>
                  <td>{student.Email}</td>
                  <td>{formatDate(student.enrollmentDate)}</td>
                  <td>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleRemoveClick(student)}
                    >
                      นำออก
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            ปิด
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>ยืนยันการนำนักเรียนออกจากห้องเรียน</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          คุณแน่ใจหรือไม่ที่ต้องการนำ {studentToRemove?.FirstName} {studentToRemove?.LastName} ออกจากห้องเรียน?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            ยกเลิก
          </Button>
          <Button variant="danger" onClick={handleConfirmRemove}>
            ยืนยัน
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default StudentListModal;