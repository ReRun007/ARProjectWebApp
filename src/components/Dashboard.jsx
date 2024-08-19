import React, { useState } from 'react';
import { Button, Card, Container, Row, Col, Nav, Dropdown, Offcanvas } from 'react-bootstrap';

function Dashboard() {

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <div>
                <Button variant="primary" onClick={handleShow} className="ms-3 mt-3">
                    Launch
                </Button>

                <Offcanvas show={show} onHide={handleClose}>
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title>Offcanvas</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        Some text as placeholder. In real life you can have the elements you
                        have chosen. Like, text, images, lists, etc.
                    </Offcanvas.Body>
                </Offcanvas>
            </div>
        </>
    );
}

export default Dashboard;
