// src/components/AdminManageUsers.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuthToken } from '../../../shared/auth/AuthUtils';

// Material-UI Imports
import {
    Container,
    Box,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TableSortLabel,
    IconButton,
    Collapse // Import Collapse
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { visuallyHidden } from '@mui/utils';

const AdminManageUsers = () => {
    const [activeTab, setActiveTab] = useState('USERS'); // 'STUDENT', 'TEACHER', or 'USERS'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [createTeacherOpen, setCreateTeacherOpen] = useState(false);
    const [newTeacherUsername, setNewTeacherUsername] = useState('');
    const [newTeacherEmail, setNewTeacherEmail] = useState('');
    const [newTeacherPassword, setNewTeacherPassword] = useState('');
    const [createTeacherLoading, setCreateTeacherLoading] = useState(false);
    const [createTeacherError, setCreateTeacherError] = useState(null);
    const [createTeacherSuccess, setCreateTeacherSuccess] = useState(null);
    const [createTeacherErrors, setCreateTeacherErrors] = useState({});
    const [expandedRowId, setExpandedRowId] = useState(null); // For collapsible rows
    const [expandedProfileDetails, setExpandedProfileDetails] = useState(null);
    const [expandedProfileLoading, setExpandedProfileLoading] = useState(false);
    const [expandedProfileError, setExpandedProfileError] = useState(null);
    const [order, setOrder] = useState('asc');
    const [orderBy, setOrderBy] = useState(activeTab === 'USERS' ? 'userId' : 'id');

    const fetchUsersByRole = async () => {
        setLoading(true);
        setError(null);
        const token = getAuthToken();

        if (!token) {
            setError("Authentication token not found. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            let responseData;
            if (activeTab === 'STUDENT') {
                const response = await axios.get(`/api/students`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                responseData = response.data.map(studentProfile => ({ // studentProfile is StudentDTO from backend
                    type: 'STUDENT',
                    id: studentProfile.studentId,
                    userId: studentProfile.user?.userId, // Access nested user DTO
                    firstName: studentProfile.firstName,
                    lastName: studentProfile.lastName,
                    universityEmail: studentProfile.universityEmail,
                    course: studentProfile.course,
                    yearLevel: studentProfile.yearLevel,
                    className: studentProfile.className,
                    section: studentProfile.section,
                    username: studentProfile.user?.username,
                    email: studentProfile.user?.email,
                    userRole: studentProfile.user?.userRole,
                    isTempPassword: studentProfile.user?.isTempPassword,
                    createdAt: studentProfile.user?.createdAt
                }));
            } else if (activeTab === 'TEACHER') {
                const response = await axios.get(`/api/teachers`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                responseData = response.data.map(teacherProfile => ({ // teacherProfile is TeacherDTO from backend
                    type: 'TEACHER',
                    id: teacherProfile.teacherId,
                    userId: teacherProfile.user?.userId, // Access nested user DTO
                    firstName: teacherProfile.firstName,
                    lastName: teacherProfile.lastName,
                    institution: teacherProfile.institution,
                    subject: teacherProfile.subject,
                    username: teacherProfile.user?.username,
                    email: teacherProfile.user?.email,
                    userRole: teacherProfile.user?.userRole,
                    isTempPassword: teacherProfile.user?.isTempPassword,
                    createdAt: teacherProfile.user?.createdAt
                }));
            } else if (activeTab === 'USERS') {
                const response = await axios.get(`/api/users`, { // Endpoint to fetch all users
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                responseData = response.data.map(user => ({ // user is UserDTO from backend
                    type: 'USER', // Generic user type for this tab
                    id: user.userId, // Use userId as the primary id for this list
                    userId: user.userId,
                    username: user.username,
                    email: user.email,
                    userRole: user.userRole,
                    isTempPassword: user.isTempPassword,
                    createdAt: user.createdAt
                }));
            }
            setUsers(responseData);
        } catch (err) {
            console.error(`Failed to fetch users with role ${activeTab}:`, err);
            setError(`Failed to load ${activeTab.toLowerCase()} data. Please try again.`);
            if (err.response && err.response.status === 403) {
                setError("You do not have permission to view this data.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset orderBy when tab changes to a default for that tab
        setOrderBy(activeTab === 'USERS' ? 'userId' : 'id');
        setOrder('asc');
    }, [activeTab]);

    useEffect(() => {
        fetchUsersByRole();
    }, [activeTab]);

    const getTabButtonStyle = (tabName) => ({
        padding: '0.75rem 1.5rem',
        borderRadius: '0.375rem',
        border: '1px solid #d1d5db',
        cursor: 'pointer',
        fontWeight: 'bold',
        transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
        backgroundColor: activeTab === tabName ? '#2563eb' : '#f9fafb',
        color: activeTab === tabName ? '#ffffff' : '#4b5563',
        borderColor: activeTab === tabName ? '#2563eb' : '#d1d5db',
    });

    const handleExpandClick = async (userId, userRole) => {        if (expandedRowId === userId) {
            setExpandedRowId(null); // Collapse if already expanded
            setExpandedProfileDetails(null);
            setExpandedProfileError(null);
        } else {
            setExpandedRowId(userId); // Expand this row
            if (activeTab === 'USERS') {
                setExpandedProfileLoading(true);
                setExpandedProfileDetails(null);
                setExpandedProfileError(null);
                const token = getAuthToken();
                try {
                    let profileEndpoint = '';
                    if (userRole === 'STUDENT') {
                        profileEndpoint = `/api/students/user/${userId}`;
                    } else if (userRole === 'TEACHER') {
                        profileEndpoint = `/api/teachers/user/${userId}`;
                    } else if (userRole === 'ADMIN') {
                        profileEndpoint = `/api/admins/user/${userId}`; // Assumes this endpoint exists
                    }

                    if (profileEndpoint) {
                        const response = await axios.get(profileEndpoint, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setExpandedProfileDetails(response.data || {}); // Ensure it's an object even if data is null/undefined
                    } else {
                        setExpandedProfileDetails({ info: "No specific profile type for this role." });
                    }
                } catch (err) {
                    console.error("Error fetching expanded profile details:", err);
                    let message = "Failed to load profile details.";
                    if (err.response && err.response.status === 404) {
                        message = "No profile details found for this user.";
                    }
                    setExpandedProfileError(message);
                    setExpandedProfileDetails(null); // Clear any previous details
                } finally {
                    setExpandedProfileLoading(false);
                }
            }
        }
    };

    const getSortedProfileDetails = (userRole, details) => {
        if (!details || Object.keys(details).length === 0) return [];

        const items = [];
        if (userRole === 'STUDENT') {
            if (details.firstName) items.push({ label: 'Name', value: `${details.firstName} ${details.lastName || ''}`.trim() });
            if (details.universityEmail) items.push({ label: 'University Email', value: details.universityEmail });
            if (details.course) items.push({ label: 'Course', value: `${details.course}${details.yearLevel ? ` - ${details.yearLevel}` : ''}` });
            if (details.className) items.push({ label: 'Class', value: `${details.className}${details.section ? ` - ${details.section}` : ''}` });
        } else if (userRole === 'TEACHER') {
            if (details.firstName) items.push({ label: 'Name', value: `${details.firstName} ${details.lastName || ''}`.trim() });
            if (details.institution) items.push({ label: 'Institution', value: details.institution });
            if (details.subject) items.push({ label: 'Subject', value: details.subject });
        } else if (userRole === 'ADMIN') { // Assuming admin might have a profile with name
            if (details.firstName) items.push({ label: 'Name', value: `${details.firstName} ${details.lastName || ''}`.trim() });
            // Add other admin-specific profile fields here if they exist
        }

        // If no specific details were pushed (e.g., for a generic USER role or if profile is empty)
        // and there's an 'info' field, display that.
        if (details.info && items.length === 0) {
            items.push({ label: 'Information', value: details.info });
        }

        return items.sort((a, b) => a.label.localeCompare(b.label));
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    function descendingComparator(a, b, orderByProperty) {
        let valA = a[orderByProperty];
        let valB = b[orderByProperty];

        // Handle date strings for createdAt
        if (orderByProperty === 'createdAt') {
            valA = new Date(valA);
            valB = new Date(valB);
        }
        // Handle boolean for isTempPassword
        if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            return (valA === valB) ? 0 : valA ? -1 : 1; // true comes before false
        }

        if (valB < valA) {
            return -1;
        }
        if (valB > valA) {
            return 1;
        }
        return 0;
    }

    function getComparator(currentOrder, orderByProperty) {
        return currentOrder === 'desc'
            ? (a, b) => descendingComparator(a, b, orderByProperty)
            : (a, b) => -descendingComparator(a, b, orderByProperty);
    }

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setDeleteConfirmOpen(true);
    };

    const handleCloseDeleteConfirm = () => {
        setDeleteConfirmOpen(false);
        setUserToDelete(null);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;

        setLoading(true);
        setError(null);
        const token = getAuthToken();

        try {
            // Delete the associated User entity, which should cascade to Student/Teacher
            const deleteEndpoint = `/api/users/${userToDelete.userId}`;

            await axios.delete(deleteEndpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            handleCloseDeleteConfirm();
            await fetchUsersByRole();

        } catch (err) {
            console.error(`Failed to delete user:`, err);
            setError(`Failed to delete user. Please try again.`);
            if (err.response && err.response.status === 403) {
                setError("You do not have permission to perform this action.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewClick = (user) => {
        alert(`Viewing details for ${user.type} ID: ${user.id}\nUser ID: ${user.userId}\nFirst Name: ${user.firstName}\nLast Name: ${user.lastName}\nMore details in console.`);
        console.log("View User Details:", user);
        // Implement navigation or modal for viewing here
    };

    const handleEditClick = (user) => {
        alert(`Editing details for ${user.type} ID: ${user.id}\nUser ID: ${user.userId}\nFirst Name: ${user.firstName}\nLast Name: ${user.lastName}\nMore details in console.`);
        console.log("Edit User Details:", user);
        // Implement navigation or modal for editing here
    };

    // --- Create Teacher Functions ---
    const handleOpenCreateTeacher = () => {
        setCreateTeacherOpen(true);
        setNewTeacherUsername('');
        setNewTeacherEmail('');
        setNewTeacherPassword('');
        setCreateTeacherError(null);
        setCreateTeacherSuccess(null);
        setCreateTeacherErrors({});
    };

    const handleCloseCreateTeacher = () => {
        setCreateTeacherOpen(false);
    };

    const validateCreateTeacherForm = () => {
        let tempErrors = {};
        if (!newTeacherUsername) tempErrors.username = "Username is required.";
        if (!newTeacherEmail) tempErrors.email = "Email is required.";
        if (!newTeacherPassword) tempErrors.password = "Temporary Password is required.";
        setCreateTeacherErrors(tempErrors);
        return Object.keys(tempErrors).length === 0;
    };

    const handleCreateTeacherSubmit = async () => {
        setCreateTeacherError(null);
        setCreateTeacherSuccess(null);

        if (!validateCreateTeacherForm()) {
            return;
        }

        setCreateTeacherLoading(true);
        const token = getAuthToken();

        try {
            const response = await axios.post('/api/auth/register/teacher', {
                username: newTeacherUsername,
                email: newTeacherEmail,
                password: newTeacherPassword
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setCreateTeacherSuccess("Teacher account created successfully!");
            await fetchUsersByRole();

            setTimeout(() => {
                handleCloseCreateTeacher();
                setCreateTeacherSuccess(null);
            }, 2000);

        } catch (err) {
            console.error("Failed to create teacher:", err);
            let errorMessage = "Failed to create teacher account.";
            if (err.response && err.response.status === 409) {
                errorMessage = "Username or email already exists.";
            } else if (err.response && err.response.data && (err.response.data.message || err.response.data.error)) {
                 errorMessage = err.response.data.message || err.response.data.error;
            }
            setCreateTeacherError(errorMessage);
        } finally {
            setCreateTeacherLoading(false);
        }
    };

    return (
        <Container
            component="main"
            maxWidth="lg"
            sx={{
                backgroundColor: '#f3f4f6',
                minHeight: '100vh',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
            }}
        >
            <Box
                sx={{
                    backgroundColor: '#ffffff',
                    padding: '2rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography
                    component="h1"
                    variant="h5"
                    sx={{
                        fontWeight: 'bold',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        color: '#1f2937'
                    }}
                >
                    Manage Users
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '2rem' }}>
                    <Box sx={{ display: 'flex', gap: '1rem' }}>
                        <Button
                            onClick={() => setActiveTab('STUDENT')}
                            sx={getTabButtonStyle('STUDENT')}
                            disabled={activeTab === 'STUDENT'}
                        >
                            Students
                        </Button>
                        <Button
                            onClick={() => setActiveTab('TEACHER')}
                            sx={getTabButtonStyle('TEACHER')}
                            disabled={activeTab === 'TEACHER'}
                        >
                            Teachers
                        </Button>
                        <Button
                            onClick={() => setActiveTab('USERS')}
                            sx={getTabButtonStyle('USERS')}
                            disabled={activeTab === 'USERS'}
                        >
+                            All Users
                        </Button>
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleOpenCreateTeacher}
                        sx={{ textTransform: 'none', borderRadius: '0.375rem' }}
                    >
                        Create Teacher Account
                    </Button>
                </Box>


                {loading && <CircularProgress sx={{ my: 4 }} />}
                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

                {!loading && !error && users.length > 0 && (
                    <Box sx={{ overflowX: 'auto', width: '100%' }}>
                        <Typography variant="h6" sx={{ mb: 1, textAlign: 'center' }}>
                            {activeTab === 'STUDENT' ? 'Student List'
                                : activeTab === 'TEACHER' ? 'Teacher List'
                                    : 'All Users List'}
                        </Typography>
                        <TableContainer component={Paper} sx={{ marginTop: '1rem' }}>
                            <Table aria-label="collapsible table">
                                <TableHead sx={{ backgroundColor: '#e5e7eb' }}>
                                    <TableRow>
                                        <TableCell /> {/* For expand/collapse icon */}
                                        <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>
                                            {activeTab === 'STUDENT' ? 'Student ID' :
                                             activeTab === 'TEACHER' ? 'Teacher ID' : 'User ID'}
                                        </TableCell>
                                        {activeTab === 'STUDENT' && (
                                            <>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>First Name</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Last Name</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>University Email</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Course</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Year Level</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Class Name</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Section</TableCell>
                                            </>
                                        )}
                                        {activeTab === 'TEACHER' &&  (
                                            <>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>First Name</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Last Name</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Institution</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Subject</TableCell>
                                            </>
                                        )}
                                        {activeTab === 'USERS' && (
                                            <>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Username</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Email</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Role</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Temp Pwd</TableCell>
                                                <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Created At</TableCell>
                                            </>
                                        )}
                                        <TableCell sx={{ color: '#374151', fontWeight: 'bold' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                {users.map((user) => (
                                    <React.Fragment key={user.userId || user.id /* Ensure unique key */}>
                                        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                            <TableCell>
                                                <IconButton
                                                    aria-label="expand row"
                                                    size="small"
                                                    onClick={() => handleExpandClick(user.userId, user.userRole)}
                                                >
                                                    {expandedRowId === user.userId ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                                </IconButton>
                                            </TableCell>
                                            <TableCell component="th" scope="row">{user.id}</TableCell>
                                            {activeTab === 'STUDENT' && (
                                                <>
                                                    <TableCell>{user.firstName}</TableCell>
                                                    <TableCell>{user.lastName}</TableCell>
                                                    <TableCell>{user.universityEmail}</TableCell>
                                                    <TableCell>{user.course}</TableCell>
                                                    <TableCell>{user.yearLevel}</TableCell>
                                                    <TableCell>{user.className}</TableCell>
                                                    <TableCell>{user.section}</TableCell>
                                                </>
                                            )}
                                            {activeTab === 'TEACHER' &&  (
                                                <>
                                                    <TableCell>{user.firstName}</TableCell>
                                                    <TableCell>{user.lastName}</TableCell>
                                                    <TableCell>{user.institution}</TableCell>
                                                    <TableCell>{user.subject}</TableCell>
                                                </>
                                            )}
                                            {activeTab === 'USERS' && (
                                                <>
                                                    <TableCell>{user.username}</TableCell>
                                                    <TableCell>{user.email}</TableCell>
                                                    <TableCell>{user.userRole}</TableCell>
                                                    <TableCell>{user.isTempPassword ? 'Yes' : 'No'}</TableCell>
                                                    <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
                                                </>
                                            )}
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    color="info"
                                                    size="small"
                                                    onClick={() => handleViewClick(user)}
                                                    sx={{ textTransform: 'none', borderRadius: '0.375rem', mr: 1, mb: { xs: 1, sm: 0 } }}
                                                >
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => handleEditClick(user)}
                                                    sx={{ textTransform: 'none', borderRadius: '0.375rem', mr: 1, mb: { xs: 1, sm: 0 } }}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={() => handleDeleteClick(user)}
                                                    sx={{ textTransform: 'none', borderRadius: '0.375rem' }}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell 
                                                style={{ paddingBottom: 0, paddingTop: 0 }} 
                                                colSpan={ activeTab === 'STUDENT' ? 10 
                                                        : activeTab === 'TEACHER' ? 6 
                                                        : 8 /* USER tab has 8 columns including icon */
                                                }
                                            >
                                                <Collapse in={expandedRowId === user.userId} timeout="auto" unmountOnExit>
                                                    <Box sx={{ margin: 1, padding: 2, backgroundColor: '#f9fafb', borderRadius: '0.25rem' }}>
                                                        {activeTab !== 'USERS' && (
                                                            <>
                                                                <Typography variant="h6" gutterBottom component="div">
                                                                    User Account Details (ID: {user.userId})
                                                                </Typography>
                                                                <Typography variant="body2"><strong>Username:</strong> {user.username || 'N/A'}</Typography>
                                                                <Typography variant="body2"><strong>Email:</strong> {user.email || 'N/A'}</Typography>
                                                                <Typography variant="body2"><strong>Role:</strong> {user.userRole || 'N/A'}</Typography>
                                                                <Typography variant="body2"><strong>Temp Password:</strong> {user.isTempPassword ? 'Yes' : 'No'}</Typography>
                                                                <Typography variant="body2"><strong>Created At:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</Typography>
                                                            </>
                                                        )}
                                                        {activeTab === 'USERS' && (
                                                            <>
                                                                <Typography variant="h6" gutterBottom component="div">
                                                                    {user.userRole} Profile Details
                                                                </Typography>
                                                                {expandedProfileLoading && <CircularProgress size={20} />}
                                                                {expandedProfileError && <Alert severity="error" size="small">{expandedProfileError}</Alert>}
                                                                {!expandedProfileLoading && !expandedProfileError && expandedProfileDetails && (
                                                                    <>
                                                                        {getSortedProfileDetails(user.userRole, expandedProfileDetails).map(detail => (
                                                                            <Typography key={detail.label} variant="body2">
                                                                                <strong>{detail.label}:</strong> {detail.value}
                                                                            </Typography>
                                                                        ))}
                                                                        {getSortedProfileDetails(user.userRole, expandedProfileDetails).length === 0 && !expandedProfileDetails?.info && <Typography variant="body2">No specific profile details available.</Typography>}
                                                                    </>
                                                                )}
                                                            </>
                                                        )}
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    </React.Fragment>
                                ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
                {!loading && !error && users.length === 0 && (
                    <Typography sx={{ my: 4, color: '#4b5563' }}>No {activeTab.toLowerCase().replace(/s$/, '')} data found.</Typography>
                )}
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={handleCloseDeleteConfirm}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete the user "{userToDelete?.firstName} {userToDelete?.lastName}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteConfirm} color="primary" sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="error" autoFocus sx={{ textTransform: 'none' }}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Teacher Account Dialog */}
            <Dialog open={createTeacherOpen} onClose={handleCloseCreateTeacher}>
                <DialogTitle>Create New Teacher Account</DialogTitle>
                <DialogContent>
                    {createTeacherError && <Alert severity="error" sx={{ mb: 2 }}>{createTeacherError}</Alert>}
                    {createTeacherSuccess && <Alert severity="success" sx={{ mb: 2 }}>{createTeacherSuccess}</Alert>}
                    <TextField
                        autoFocus
                        margin="dense"
                        id="username"
                        label="Username"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newTeacherUsername}
                        onChange={(e) => setNewTeacherUsername(e.target.value)}
                        error={!!createTeacherErrors.username}
                        helperText={createTeacherErrors.username}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="email"
                        label="Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={newTeacherEmail}
                        onChange={(e) => setNewTeacherEmail(e.target.value)}
                        error={!!createTeacherErrors.email}
                        helperText={createTeacherErrors.email}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        id="password"
                        label="Temporary Password"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={newTeacherPassword}
                        onChange={(e) => setNewTeacherPassword(e.target.value)}
                        error={!!createTeacherErrors.password}
                        helperText={createTeacherErrors.password}
                        sx={{ mb: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateTeacher} color="primary" sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateTeacherSubmit}
                        color="primary"
                        variant="contained"
                        disabled={createTeacherLoading}
                        sx={{ textTransform: 'none' }}
                    >
                        {createTeacherLoading ? <CircularProgress size={24} color="inherit" /> : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

// Helper function to create sortable table headers
const SortableTableCell = ({ columnId, label, activeOrderBy, currentOrder, onRequestSort, sx }) => {
    const createSortHandler = (property) => (event) => {
        onRequestSort(property);
    };

    return (
        <TableCell
            key={columnId}
            sortDirection={activeOrderBy === columnId ? currentOrder : false}
            sx={{ color: '#374151', fontWeight: 'bold', ...sx }}
        >
            <TableSortLabel
                active={activeOrderBy === columnId}
                direction={activeOrderBy === columnId ? currentOrder : 'asc'}
                onClick={createSortHandler(columnId)}
            >
                {label}
                {activeOrderBy === columnId ? (
                    <Box component="span" sx={visuallyHidden}>
                        {currentOrder === 'desc' ? 'sorted descending' : 'sorted ascending'}
                    </Box>
                ) : null}
            </TableSortLabel>
        </TableCell>
    );
};

// Define columns for each tab to make it easier to manage sortable headers
const studentColumns = [
    { id: 'id', label: 'Student ID' },
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'universityEmail', label: 'University Email' },
    { id: 'course', label: 'Course' },
    { id: 'yearLevel', label: 'Year Level' },
    { id: 'className', label: 'Class Name' },
    { id: 'section', label: 'Section' },
];

const teacherColumns = [
    { id: 'id', label: 'Teacher ID' },
    { id: 'firstName', label: 'First Name' },
    { id: 'lastName', label: 'Last Name' },
    { id: 'institution', label: 'Institution' },
    { id: 'subject', label: 'Subject' },
];

const userColumns = [
    { id: 'id', label: 'User ID' }, // 'id' here refers to user.id which is user.userId for this tab
    { id: 'username', label: 'Username' },
    { id: 'email', label: 'Email' },
    { id: 'userRole', label: 'Role' },
    { id: 'isTempPassword', label: 'Temp Pwd' },
    { id: 'createdAt', label: 'Created At' },
];

export default AdminManageUsers;