import React, { useState, useEffect } from 'react';
import { Card, Badge, Modal, Button, Form, ListGroup, Spinner, Image } from 'react-bootstrap';
import { FaUser, FaClock, FaPaperclip, FaImage, FaDownload, FaComment, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { db, storage } from '../../../firebase';
import { doc, getDoc, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { useUserAuth } from '../../../context/UserAuthContext';

function StudentPostDisplay({ posts, classId }) {
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [usersData, setUsersData] = useState({});
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState({});
    const [loadingComments, setLoadingComments] = useState(true);
    const [commentUsers, setCommentUsers] = useState({});
    const { user } = useUserAuth();
    const [expandedComments, setExpandedComments] = useState({});

    useEffect(() => {
        fetchUsersData();
        const unsubscribe = subscribeToComments();
        return () => unsubscribe();
    }, [posts, classId]);

    const fetchUsersData = async () => {
        const userData = {};
        for (const post of posts) {
            if (!userData[post.createdBy]) {
                const userDoc = await getDoc(doc(db, 'Teachers', post.createdBy));
                if (userDoc.exists()) {
                    const user = userDoc.data();
                    let profileImageUrl = null;
                    if (user.URLImage) {
                        try {
                            profileImageUrl = await getDownloadURL(ref(storage, user.URLImage));
                        } catch (error) {
                            console.error("Error fetching profile image:", error);
                        }
                    }
                    userData[post.createdBy] = {
                        username: user.Username,
                        firstName: user.FirstName,
                        lastName: user.LastName,
                        profileImage: profileImageUrl
                    };
                }
            }
        }
        setUsersData(userData);
    };

    const subscribeToComments = () => {
        const commentsQuery = query(
            collection(db, 'Comments'),
            where('classId', '==', classId),
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(commentsQuery, async (snapshot) => {
            setLoadingComments(true);
            const updatedComments = {};
            const userPromises = [];

            snapshot.docs.forEach((doc) => {
                const comment = { id: doc.id, ...doc.data() };
                if (!updatedComments[comment.postId]) {
                    updatedComments[comment.postId] = [];
                }
                updatedComments[comment.postId].push(comment);

                if (!commentUsers[comment.createdBy]) {
                    userPromises.push(fetchUserData(comment.createdBy));
                }
            });

            setComments(updatedComments);

            if (userPromises.length > 0) {
                const users = await Promise.all(userPromises);
                const newCommentUsers = { ...commentUsers };
                users.forEach(user => {
                    if (user) newCommentUsers[user.id] = user;
                });
                setCommentUsers(newCommentUsers);
            }

            setLoadingComments(false);
        });
    };

    const fetchUserData = async (userId) => {
        try {
            const userDoc = await getDoc(doc(db, 'Students', userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                let profileImageUrl = null;
                if (userData.URLImage) {
                    try {
                        profileImageUrl = await getDownloadURL(ref(storage, userData.URLImage));
                    } catch (error) {
                        console.error("Error fetching profile image:", error);
                    }
                }
                return { id: userId, ...userData, profileImage: profileImageUrl };
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
        return null;
    };

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleMediaClick = (mediaUrl, mediaType) => {
        setSelectedMedia({ url: mediaUrl, type: mediaType });
        setShowMediaModal(true);
    };

    const renderFileAttachment = (post) => {
        if (!post.fileUrl) return null;

        const fileType = post.fileName ? post.fileName.split('.').pop().toLowerCase() : '';
        const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(fileType);
        const isVideo = ['mp4', 'webm', 'ogg'].includes(fileType);

        const mediaStyle = {
            maxWidth: '100%',
            maxHeight: '200px',
            width: 'auto',
            height: 'auto',
            objectFit: 'contain',
            cursor: 'pointer'
        };

        if (isImage) {
            return (
                <div className="mt-3">
                    <img
                        src={post.fileUrl}
                        alt="Attached"
                        style={mediaStyle}
                        onClick={() => handleMediaClick(post.fileUrl, 'image')}
                        className="rounded shadow-sm"
                    />
                </div>
            );
        } else if (isVideo) {
            return (
                <div className="mt-3">
                    <video
                        controls
                        style={mediaStyle}
                        className="rounded shadow-sm"
                    >
                        <source src={post.fileUrl} type={`video/${fileType}`} />
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        } else {
            return (
                <Button
                    variant="outline-primary"
                    size="sm"
                    href={post.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3"
                >
                    <FaDownload className="me-2" /> {post.fileName || 'ดาวน์โหลดไฟล์แนบ'}
                </Button>
            );
        }
    };

    const handleShowCommentModal = (post) => {
        setSelectedPost(post);
        setShowCommentModal(true);
    };

    const handleAddComment = async (postId) => {
        if (comment.trim() === '') return;

        const newComment = {
            postId: postId,
            content: comment,
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            classId: classId
        };

        try {
            await addDoc(collection(db, 'Comments'), newComment);
            setComment('');
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    };

    const toggleCommentExpansion = (postId) => {
        setExpandedComments(prev => ({
            ...prev,
            [postId]: !prev[postId]
        }));
    };

    const renderComments = (postId, isModal = false) => {
        const postComments = comments[postId] || [];
        const isExpanded = expandedComments[postId] || isModal;
        const displayComments = isExpanded ? postComments : postComments.slice(0, 3);

        return (
            <>
                <ListGroup variant="flush" className="mt-3">
                    {displayComments.map((comment) => (
                        <ListGroup.Item key={comment.id}>
                            <div className="d-flex">
                                <Image
                                    src={commentUsers[comment.createdBy]?.profileImage || '/default-avatar.png'}
                                    roundedCircle
                                    width="32"
                                    height="32"
                                    className="me-2"
                                />
                                <div>
                                    <div className="fw-bold">{commentUsers[comment.createdBy]?.FirstName || 'ผู้ใช้'}</div>
                                    <p>{comment.content}</p>
                                    <small className="text-muted">{formatDate(comment.createdAt?.toDate())}</small>
                                </div>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
                {!isModal && postComments.length > 3 && (
                    <Button
                        variant="link"
                        className="w-100 text-center mt-2"
                        onClick={() => toggleCommentExpansion(postId)}
                    >
                        {isExpanded ? (
                            <>ซ่อนความคิดเห็น <FaChevronUp /></>
                        ) : (
                            <>ดูความคิดเห็นทั้งหมด ({postComments.length}) <FaChevronDown /></>
                        )}
                    </Button>
                )}
                <Form className="mt-3">
                    <Form.Group>
                        <Form.Control
                            as="textarea"
                            rows={1}
                            placeholder="เขียนความคิดเห็นของคุณ..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </Form.Group>
                    <Button variant="primary" className="mt-2" onClick={() => handleAddComment(postId)}>
                        ส่งความคิดเห็น
                    </Button>
                </Form>
            </>
        );
    };

    return (
        <>
            {posts.length > 0 ? (
                posts.map((post) => (
                    <Card key={post.id} className="shadow-sm mb-4 border-0 overflow-hidden">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                {usersData[post.createdBy]?.profileImage ? (
                                    <img
                                        src={usersData[post.createdBy].profileImage}
                                        alt="Profile"
                                        className="rounded-circle me-3"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="bg-primary text-white rounded-circle p-2 me-3">
                                        <FaUser />
                                    </div>
                                )}
                                <div>
                                    <strong className="d-block">
                                        {usersData[post.createdBy]?.firstName} {usersData[post.createdBy]?.lastName} (@{usersData[post.createdBy]?.username || 'ไม่ระบุชื่อ'})
                                    </strong>
                                    <small className="text-muted">
                                        <FaClock className="me-1" />
                                        {formatDate(post.createdAt?.toDate())}
                                    </small>
                                </div>
                            </div>
                            <Card.Text className="mb-3">{post.content}</Card.Text>
                            {post.fileUrl && (
                                <Badge bg="light" text="dark" className="mb-3">
                                    <FaPaperclip className="me-1" /> ไฟล์แนบ
                                </Badge>
                            )}
                            {renderFileAttachment(post)}
                            <div className="mt-3">
                                <Button variant="outline-primary" size="sm" onClick={() => handleShowCommentModal(post)}>
                                    <FaComment className="me-1" /> ความคิดเห็น ({comments[post.id]?.length || 0})
                                </Button>
                            </div>
                            {renderComments(post.id)}
                        </Card.Body>
                    </Card>
                ))
            ) : (
                <Card className="shadow-sm mb-4 border-0 text-center py-5">
                    <Card.Body>
                        <FaImage className="mb-3 text-muted" size={50} />
                        <Card.Title>ยังไม่มีโพสต์ในห้องเรียนนี้</Card.Title>
                        <Card.Text className="text-muted">ติดตามข่าวสารและประกาศสำคัญจากครูผู้สอนที่นี่</Card.Text>
                    </Card.Body>
                </Card>
            )}

            <Modal show={showMediaModal} onHide={() => setShowMediaModal(false)} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>{selectedMedia?.type === 'image' ? 'รูปภาพเต็ม' : 'วิดีโอ'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center p-0">
                    {selectedMedia?.type === 'image' ? (
                        <img
                            src={selectedMedia.url}
                            alt="Enlarged"
                            style={{ maxWidth: '100%', maxHeight: '80vh', width: 'auto', height: 'auto' }}
                        />
                    ) : (
                        <video controls style={{ maxWidth: '100%', maxHeight: '80vh', width: 'auto', height: 'auto' }}>
                            <source src={selectedMedia?.url} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )}
                </Modal.Body>
            </Modal>

            <Modal
                show={showCommentModal}
                onHide={() => {
                    setShowCommentModal(false);
                    setComment('');
                }}
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>ความคิดเห็นทั้งหมด</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {loadingComments ? (
                        <div className="text-center">
                            <Spinner animation="border" role="status">
                                <span className="visually-hidden">กำลังโหลด...</span>
                            </Spinner>
                        </div>
                    ) : selectedPost ? (
                        <>
                            {renderComments(selectedPost.id, true)}
                        </>
                    ) : (
                        <p>ไม่พบความคิดเห็น</p>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
}

export default StudentPostDisplay;