import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaChalkboardTeacher, FaArrowRight } from 'react-icons/fa';

const EmptyClassroomState = ({ onJoinClass }) => {
  return (
    <Card className="text-center shadow-sm">
      <Card.Body className="py-5">
        <FaChalkboardTeacher size={64} className="text-primary mb-3" />
        <Card.Title className="mb-3">ยังไม่มีห้องเรียน</Card.Title>
        <Card.Text>
          คุณยังไม่ได้เข้าร่วมห้องเรียนใดๆ เริ่มต้นการเรียนรู้ของคุณวันนี้!
        </Card.Text>
        <Button variant="primary" onClick={onJoinClass}>
          เข้าร่วมห้องเรียนเลย <FaArrowRight className="ms-2" />
        </Button>
      </Card.Body>
    </Card>
  );
};

export default EmptyClassroomState;