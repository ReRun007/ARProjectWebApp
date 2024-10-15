import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { FaChalkboardTeacher, FaArrowRight } from 'react-icons/fa';

const EmptyClassroomState = ({ onAddClassroom }) => {
  return (
    <Card className="text-center shadow-sm" bg="light" border="primary">
      <Card.Body className="py-5">
        <FaChalkboardTeacher size={64} className="mb-3 text-primary" />
        <Card.Title className="mb-3">ยังไม่มีห้องเรียน</Card.Title>
        <Card.Text>
          คุณยังไม่ได้สร้างห้องเรียนใดๆ เริ่มต้นการสอนของคุณวันนี้!
        </Card.Text>
        <Button 
          variant="primary" 
          onClick={onAddClassroom}
        >
          สร้างห้องเรียนใหม่ <FaArrowRight className="ms-2" />
        </Button>
      </Card.Body>
    </Card>
  );
};

export default EmptyClassroomState;