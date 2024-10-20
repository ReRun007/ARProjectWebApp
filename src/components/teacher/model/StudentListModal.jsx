import React, { useState } from 'react';
import { Modal, Button, Card, Row, Col, Form, InputGroup, Badge, Image } from 'react-bootstrap';
import { FaSearch, FaUserGraduate, FaEnvelope, FaCalendarAlt, FaTrashAlt, FaUser } from 'react-icons/fa';

const StudentListModal = ({ show, onHide, students, onRemoveStudent }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredStudents = students.filter(student =>
    student.FirstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.LastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.Username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.Email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (firstName, lastName) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title><FaUserGraduate className="me-2" />รายชื่อนักเรียนในห้องเรียน</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="ค้นหานักเรียน..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredStudents.map((student, index) => (
              <Col key={student.id}>
                <Card className="h-100 shadow-sm">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      {student.URLImage ? (
                        <Image 
                          src={student.URLImage} 
                          roundedCircle 
                          style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                          className="me-3"
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary text-white d-flex justify-content-center align-items-center me-3"
                          style={{ width: '60px', height: '60px', fontSize: '24px' }}
                        >
                          {getInitials(student.FirstName, student.LastName)}
                        </div>
                      )}
                      <div>
                        <Card.Title className="mb-0">{student.FirstName} {student.LastName}</Card.Title>
                        <Card.Subtitle className="text-muted">@{student.Username}</Card.Subtitle>
                      </div>
                    </div>
                    <Card.Text>
                      <FaEnvelope className="me-2" />{student.Email}<br />
                      <FaCalendarAlt className="me-2" />วันที่ลงทะเบียน: {formatDate(student.enrollmentDate)}
                    </Card.Text>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveClick(student)}
                    >
                      <FaTrashAlt className="me-2" />นำออก
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          {filteredStudents.length === 0 && (
            <p className="text-center text-muted mt-4">ไม่พบนักเรียนที่ตรงกับการค้นหา</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Badge bg="primary" className="me-2">จำนวนนักเรียนทั้งหมด: {students.length}</Badge>
          <Button variant="secondary" onClick={onHide}>
            ปิด
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>ยืนยันการนำนักเรียนออกจากห้องเรียน</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          คุณแน่ใจหรือไม่ที่ต้องการนำ <strong>{studentToRemove?.FirstName} {studentToRemove?.LastName}</strong> ออกจากห้องเรียน?
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