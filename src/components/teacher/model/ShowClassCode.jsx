import React from 'react';
import { Modal, Button } from 'react-bootstrap';

function ShowClassCode({ show, onHide, classId }) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>รหัสห้องเรียน</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                <h2 className="display-4">{classId}</h2>
                <p className="text-muted">ใช้รหัสนี้เพื่อเชิญนักเรียนเข้าร่วมห้องเรียน</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    ปิด
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ShowClassCode;