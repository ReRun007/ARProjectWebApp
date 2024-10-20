import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge, Modal, ListGroup, Spinner, Image } from 'react-bootstrap';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, onSnapshot, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useUserAuth } from '../../../context/UserAuthContext';
import { FaImage, FaPlusCircle, FaUser, FaClock, FaPaperclip, FaDownload, FaComment, FaChevronDown, FaChevronUp, FaEdit, FaTrash } from 'react-icons/fa';

function PostManagement({ classId }) {
    const [posts, setPosts] = useState([]);
    const [newPost, setNewPost] = useState('');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [alertMessage, setAlertMessage] = useState(null);
    const { user } = useUserAuth();
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [usersData, setUsersData] = useState({});
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState({});
    const [loadingComments, setLoadingComments] = useState(true);
    const [commentUsers, setCommentUsers] = useState({});
    const [expandedComments, setExpandedComments] = useState({});
    const [editingPost, setEditingPost] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [showEditCommentModal, setShowEditCommentModal] = useState(false);
    const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);

    useEffect(() => {
        fetchPosts();
        const unsubscribe = subscribeToComments();
        return () => unsubscribe();
    }, [classId]);

    useEffect(() => {
        if (posts.length > 0 && user) {
            fetchUsersData();
        }
    }, [posts, user]);

    const fetchPosts = async () => {
        try {
            const postsQuery = query(
                collection(db, 'Posts'),
                where('classId', '==', classId),
                orderBy('createdAt', 'desc')
            );
            const postsSnapshot = await getDocs(postsQuery);
            const postsData = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPosts(postsData);

            // Fetch user data for posts
            const userIds = new Set(postsData.map(post => post.createdBy));
            const userData = {};
            for (const userId of userIds) {
                const userDoc = await getDoc(doc(db, 'Teachers', userId));
                if (userDoc.exists()) {
                    userData[userId] = userDoc.data();
                }
            }
            setUsersData(prevData => ({ ...prevData, ...userData }));
        } catch (error) {
            console.error("Error fetching posts: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการโหลดโพสต์ กรุณาลองใหม่อีกครั้ง' });
        }
    };

    const fetchUsersData = async () => {
        const userData = {};
        const teacherIds = new Set([...posts.map(post => post.createdBy), user.uid]);

        for (const teacherId of teacherIds) {
            if (!userData[teacherId]) {
                try {
                    const userDoc = await getDoc(doc(db, 'Teachers', teacherId));
                    if (userDoc.exists()) {
                        const teacherData = userDoc.data();
                        let profileImageUrl = null;
                        if (teacherData.URLImage) {
                            try {
                                profileImageUrl = await getDownloadURL(ref(storage, teacherData.URLImage));
                            } catch (error) {
                                console.error("Error fetching profile image:", error);
                            }
                        }
                        userData[teacherId] = {
                            username: teacherData.Username,
                            firstName: teacherData.FirstName,
                            lastName: teacherData.LastName,
                            profileImage: profileImageUrl
                        };
                    }
                } catch (error) {
                    console.error("Error fetching teacher data:", error);
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
            let userDoc = await getDoc(doc(db, 'Students', userId));
            if (!userDoc.exists()) {
                userDoc = await getDoc(doc(db, 'Teachers', userId));
            }
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

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            if (e.target.files[0].type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result);
                };
                reader.readAsDataURL(e.target.files[0]);
            } else {
                setPreviewUrl(null);
            }
        } else {
            setFile(null);
            setPreviewUrl(null);
        }
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (newPost.trim() === '') return;

        try {
            let fileUrl = '';
            let fileName = '';
            if (file) {
                const storageRef = ref(storage, `User/${user.email}/Post/${file.name}`);
                await uploadBytes(storageRef, file);
                fileUrl = await getDownloadURL(storageRef);
                fileName = file.name;
            }

            const postData = {
                content: newPost,
                classId: classId,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                fileUrl,
                fileName
            };

            await addDoc(collection(db, 'Posts'), postData);
            setNewPost('');
            setFile(null);
            setPreviewUrl(null);
            fetchPosts();
            setAlertMessage({ type: 'success', text: 'โพสต์สำเร็จ!' });
        } catch (error) {
            console.error("Error posting: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการโพสต์ กรุณาลองอีกครั้ง' });
        }
    };

    const handleEditPost = async (e) => {
        e.preventDefault();
        if (!editingPost) return;

        try {
            let fileUrl = editingPost.fileUrl;
            let fileName = editingPost.fileName;

            if (file) {
                const storageRef = ref(storage, `User/${user.email}/Post/${file.name}`);
                await uploadBytes(storageRef, file);
                fileUrl = await getDownloadURL(storageRef);
                fileName = file.name;
            }

            const postRef = doc(db, 'Posts', editingPost.id);
            await updateDoc(postRef, {
                content: editingPost.content,
                fileUrl,
                fileName,
                updatedAt: serverTimestamp()
            });

            setShowEditModal(false);
            setEditingPost(null);
            setFile(null);
            setPreviewUrl(null);
            fetchPosts();
            setAlertMessage({ type: 'success', text: 'แก้ไขโพสต์สำเร็จ!' });
        } catch (error) {
            console.error("Error editing post: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการแก้ไขโพสต์ กรุณาลองอีกครั้ง' });
        }
    };

    const handleDeleteClick = (post) => {
        setPostToDelete(post);
        setShowDeleteModal(true);
    };

    const handleDeletePost = async () => {
        if (!postToDelete) return;

        try {
            // Delete the post document
            await deleteDoc(doc(db, 'Posts', postToDelete.id));

            // Delete associated file if exists
            if (postToDelete.fileUrl) {
                try {
                    const fileRef = ref(storage, postToDelete.fileUrl);
                    await deleteObject(fileRef);
                } catch (error) {
                    console.error("Error deleting file:", error);
                }
            }

            // Delete associated comments
            const commentsQuery = query(
                collection(db, 'Comments'),
                where('postId', '==', postToDelete.id)
            );
            const commentsSnapshot = await getDocs(commentsQuery);
            const deleteCommentPromises = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteCommentPromises);

            setShowDeleteModal(false);
            setPostToDelete(null);
            setAlertMessage({ type: 'success', text: 'ลบโพสต์สำเร็จ!' });
            await fetchPosts(); // Refresh the posts list
        } catch (error) {
            console.error("Error deleting post: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการลบโพสต์ กรุณาลองอีกครั้ง' });
        }
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

    const handleEditComment = async () => {
        if (!editingComment) return;

        try {
            const commentRef = doc(db, 'Comments', editingComment.id);
            await updateDoc(commentRef, {
                content: editingComment.content,
                updatedAt: serverTimestamp()
            });

            setShowEditCommentModal(false);
            setEditingComment(null);
            setAlertMessage({ type: 'success', text: 'แก้ไขความคิดเห็นสำเร็จ!' });
        } catch (error) {
            console.error("Error editing comment: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการแก้ไขความคิดเห็น กรุณาลองอีกครั้ง' });
        }
    };

    const handleDeleteComment = async () => {
        if (!commentToDelete) return;

        try {
            await deleteDoc(doc(db, 'Comments', commentToDelete.id));
            setShowDeleteCommentModal(false);
            setCommentToDelete(null);
            setAlertMessage({ type: 'success', text: 'ลบความคิดเห็นสำเร็จ!' });
        } catch (error) {
            console.error("Error deleting comment: ", error);
            setAlertMessage({ type: 'danger', text: 'เกิดข้อผิดพลาดในการลบความคิดเห็น กรุณาลองอีกครั้ง' });
        }
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
                            <div className="d-flex justify-content-between">
                                <div className="d-flex">
                                    <Image
                                        src={commentUsers[comment.createdBy]?.profileImage || '/default-avatar.png'}
                                        roundedCircle
                                        width="32"
                                        height="32"
                                        className="me-2"
                                    />
                                    <div>
                                        <div className="fw-bold">
                                            {commentUsers[comment.createdBy]?.FirstName || 'ผู้ใช้'} {commentUsers[comment.createdBy]?.LastName || ''}
                                        </div>
                                        <p>{comment.content}</p>
                                        <small className="text-muted">
                                            {formatDate(comment.createdAt?.toDate())}
                                            {comment.updatedAt && ' (แก้ไขแล้ว)'}
                                        </small>
                                    </div>
                                </div>
                                {comment.createdBy === user.uid && (
                                    <div>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-secondary p-0 me-2"
                                            onClick={() => {
                                                setEditingComment(comment);
                                                setShowEditCommentModal(true);
                                            }}
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="text-danger p-0"
                                            onClick={() => {
                                                setCommentToDelete(comment);
                                                setShowDeleteCommentModal(true);
                                            }}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </div>
                                )}
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
            <Card className="shadow-sm mb-4">
                <Card.Body>
                    <Card.Title>สร้างโพสต์ใหม่</Card.Title>
                    <Form onSubmit={handlePostSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder="เขียนโพสต์ของคุณที่นี่..."
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>
                                <FaPlusCircle className="me-2" />
                                เพิ่มไฟล์แนบ
                            </Form.Label>
                            <Form.Control type="file" onChange={handleFileChange} />
                        </Form.Group>
                        {previewUrl && (
                            <div className="mb-3">
                                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} className="rounded" />
                            </div>
                        )}
                        <Button variant="primary" type="submit">
                            <FaImage className="me-2" /> โพสต์
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            {alertMessage && (
                <Alert variant={alertMessage.type} onClose={() => setAlertMessage(null)} dismissible className="mb-4">
                    {alertMessage.text}
                </Alert>
            )}

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
                                        {usersData[post.createdBy]?.firstName || post.createdByName || 'ไม่ระบุชื่อ'} {usersData[post.createdBy]?.lastName || ''}
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
                                {post.createdBy === user.uid && (
                                    <>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={() => {
                                                setEditingPost(post);
                                                setShowEditModal(true);
                                                setFile(null);
                                                setPreviewUrl(null);
                                            }}
                                            className="me-2"
                                        >
                                            <FaEdit className="me-1" /> แก้ไขโพส
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleDeleteClick(post)}
                                        >
                                            <FaTrash className="me-1" /> ลบโพส
                                        </Button>
                                    </>
                                )}
                                <br /> <br />
                                <Button variant="outline-primary" size="sm" onClick={() => handleShowCommentModal(post)} className="me-2">
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
                        <Card.Text className="text-muted">เริ่มแบ่งปันข่าวสารและประกาศสำคัญกับนักเรียนของคุณ!</Card.Text>
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

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>แก้ไขโพสต์</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleEditPost}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={editingPost?.content || ''}
                                onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                                placeholder="แก้ไขโพสต์ของคุณที่นี่..."
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>แก้ไขไฟล์แนบ</Form.Label>
                            <Form.Control
                                type="file"
                                onChange={handleFileChange}
                            />
                        </Form.Group>
                        {previewUrl && (
                            <div className="mb-3">
                                <img src={previewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} className="rounded" />
                            </div>
                        )}
                        {editingPost?.fileUrl && !previewUrl && (
                            <div className="mb-3">
                                <p>ไฟล์แนบปัจจุบัน: {editingPost.fileName}</p>
                                {editingPost.fileUrl.includes('image') && (
                                    <img src={editingPost.fileUrl} alt="Current attachment" style={{ maxWidth: '100%', maxHeight: '200px' }} className="rounded" />
                                )}
                            </div>
                        )}
                        <Button variant="primary" type="submit">
                            บันทึกการแก้ไข
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>


            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>ยืนยันการลบโพสต์</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        ยกเลิก
                    </Button>
                    <Button variant="danger" onClick={handleDeletePost}>
                        ยืนยันการลบ
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showEditCommentModal} onHide={() => setShowEditCommentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>แก้ไขความคิดเห็น</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={(e) => { e.preventDefault(); handleEditComment(); }}>
                        <Form.Group className="mb-3">
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={editingComment?.content || ''}
                                onChange={(e) => setEditingComment({ ...editingComment, content: e.target.value })}
                                placeholder="แก้ไขความคิดเห็นของคุณที่นี่..."
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            บันทึกการแก้ไข
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <Modal show={showDeleteCommentModal} onHide={() => setShowDeleteCommentModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>ยืนยันการลบความคิดเห็น</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>คุณแน่ใจหรือไม่ที่จะลบความคิดเห็นนี้? การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteCommentModal(false)}>
                        ยกเลิก
                    </Button>
                    <Button variant="danger" onClick={handleDeleteComment}>
                        ยืนยันการลบ
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default PostManagement;