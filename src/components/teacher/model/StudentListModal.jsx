import React from 'react';
import { Modal, Table, Button } from 'react-bootstrap';

const StudentListModal = ({ show, onHide, students }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่ระบุ';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
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
  );
};

export default StudentListModal;