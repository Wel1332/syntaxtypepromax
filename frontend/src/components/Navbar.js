import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthToken, setAuthToken, subscribeToAuthChanges } from '../utils/AuthUtils'; // Import subscribeToAuthChanges
import { getUserRole } from '../utils/JwtUtils';

// Material-UI Imports
import {
    AppBar,
    Toolbar,
    Button,
    Box,
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Typography,
    Divider,
    useMediaQuery,
    useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExtensionIcon from '@mui/icons-material/Extension';
import GridViewIcon from '@mui/icons-material/GridView';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SchoolIcon from '@mui/icons-material/School';
import EditNoteIcon from '@mui/icons-material/EditNote';
import BoltIcon from '@mui/icons-material/Bolt';
import GroupsIcon from '@mui/icons-material/Groups';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import TerminalIcon from '@mui/icons-material/Terminal';
import Tooltip from '@mui/material/Tooltip';
import { useThemeMode } from '../utils/ThemeContext';

const Navbar = () => {
    const navigate = useNavigate();
    // Initialize isLoggedIn state based on current token status
    const [isLoggedIn, setIsLoggedIn] = useState(!!getAuthToken());
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { mode, toggleMode } = useThemeMode();

    const handleNavigation = (path) => {
        setSidebarOpen(false);
        navigate(path);
    }

    const token = getAuthToken();
    const userRole = (() => {
        try { return token ? getUserRole(token) : null; } catch { return null; }
    })();

    const sidebarSections = [
        {
            title: 'Overview',
            items: [
                { text: 'Dashboard', link: '/dashboard', icon: <DashboardIcon /> },
            ],
        },
        {
            title: 'Games',
            items: [
                { text: 'Typing Test', link: '/typingtest', icon: <KeyboardIcon /> },
                { text: 'Falling Code', link: '/fallingtypingtest', icon: <CloudDownloadIcon /> },
                { text: 'Syntax Sniper', link: '/syntax-sniper', icon: <GpsFixedIcon /> },
                { text: 'Translation Terminal', link: '/translation-terminal', icon: <TerminalIcon /> },
                { text: 'Galaxy Mode', link: '/galaxy-new', icon: <RocketLaunchIcon /> },
                { text: 'Bookworm', link: '/bookworm', icon: <MenuBookIcon /> },
                { text: 'Quiz', link: '/quiz', icon: <ExtensionIcon /> },
                { text: 'Grid Game', link: '/grid', icon: <GridViewIcon /> },
            ],
        },
        {
            title: 'Learn',
            items: [
                { text: 'All Lessons', link: '/lessons/all', icon: <MenuBookIcon /> },
            ],
        },
        {
            title: 'Community',
            items: [
                { text: 'Leaderboard', link: '/leaderboard', icon: <EmojiEventsIcon /> },
            ],
        },
        ...(userRole === 'TEACHER' || userRole === 'ADMIN'
            ? [{
                title: 'Instructor',
                items: [
                    { text: 'Instructor Module', link: '/instructor', icon: <SchoolIcon /> },
                    { text: 'Create Lesson', link: '/lesson', icon: <EditNoteIcon /> },
                    { text: 'Challenges', link: '/challenges', icon: <BoltIcon /> },
                ],
            }]
            : []),
        ...(userRole === 'ADMIN'
            ? [{
                title: 'Admin',
                items: [
                    { text: 'Manage Users', link: '/admin/users', icon: <GroupsIcon /> },
                ],
            }]
            : []),
    ];

    const RenderSidebar = (
        <Box
            sx={{
                width: 280,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
                color: 'text.primary',
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: 2.5,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}
            >
                <Box
                    component="img"
                    src="/images/syntaxtypelogo1.png"
                    alt="SyntaxType"
                    sx={{
                        height: 36,
                        width: 'auto',
                        imageRendering: 'pixelated',
                        filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.4))',
                    }}
                />
                <IconButton size="small" onClick={() => setSidebarOpen(false)} aria-label="close menu" sx={{ color: 'text.primary' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Sections */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1 }}>
                {sidebarSections.map((section, sIdx) => (
                    <Box key={section.title} sx={{ mb: 1 }}>
                        <Typography
                            variant="overline"
                            sx={{
                                px: 2.5,
                                pt: 1.5,
                                pb: 0.5,
                                display: 'block',
                                color: 'primary.main',
                                fontWeight: 700,
                                letterSpacing: 1.5,
                                fontSize: '0.7rem',
                            }}
                        >
                            {section.title}
                        </Typography>
                        <List dense disablePadding>
                            {section.items.map((item) => (
                                <ListItem key={item.link} disablePadding sx={{ px: 1 }}>
                                    <ListItemButton
                                        onClick={() => handleNavigation(item.link)}
                                        sx={{
                                            borderRadius: 1.5,
                                            py: 1,
                                            px: 1.5,
                                            transition: 'all 150ms',
                                            '&:hover': {
                                                bgcolor: 'rgba(200,69,109,0.12)',
                                                transform: 'translateX(4px)',
                                                '& .MuiListItemIcon-root': { color: 'primary.main' },
                                                '& .MuiListItemText-primary': { color: 'primary.main' },
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 36,
                                                color: 'text.secondary',
                                                transition: 'color 150ms',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            slotProps={{
                                                primary: {
                                                    fontWeight: 600,
                                                    fontSize: '0.95rem',
                                                    sx: { transition: 'color 150ms' },
                                                },
                                            }}
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                        {sIdx < sidebarSections.length - 1 && (
                            <Divider sx={{ mt: 1, borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }} />
                        )}
                    </Box>
                ))}
            </Box>

            {/* Footer */}
            <Box
                sx={{
                    p: 2,
                    borderTop: '1px solid',
                    borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                }}
            >
                <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    startIcon={<LogoutIcon />}
                    onClick={() => { setSidebarOpen(false); handleLogout(); }}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    )

    
    // Effect to update login status when token changes (via custom event)
    useEffect(() => {
        // Subscribe to custom auth change events from AuthUtils
        const unsubscribe = subscribeToAuthChanges((loggedInStatus) => {
            setIsLoggedIn(loggedInStatus);
        });

        // Initial check on mount (important for first render)
        setIsLoggedIn(!!getAuthToken());

        // Cleanup subscription on unmount
        return () => {
            unsubscribe(); // Unsubscribe from the custom event to prevent memory leaks
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount.

    const handleLogout = () => {
        setAuthToken(null); // This will dispatch the custom event via AuthUtils
        navigate('/login'); // Redirect to login page
    };

    const toggleSidebar = (open) => (event) => {
        if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
            return;
        }
        setSidebarOpen(open);
    };

    return (
        <>
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    backgroundColor: 'background.default',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: (theme) => theme.palette.mode === 'dark'
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(0,0,0,0.06)',
                    backdropFilter: 'blur(8px)',
                }}
            >
                <Toolbar>
                {isLoggedIn ? (
                        <>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                            onClick={toggleSidebar(true)}
                        >
                            <MenuIcon />
                        </IconButton>

                        <Drawer
                            anchor="left"
                            open={sidebarOpen}
                            onClose={toggleSidebar(false)}
                            slotProps={{
                                paper: {
                                    sx: {
                                        bgcolor: 'background.default',
                                        backgroundImage: 'none',
                                        borderRight: '1px solid',
                                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                    },
                                },
                            }}
                        >
                            {RenderSidebar}
                        </Drawer>
                        </>
                    ) : null}


                    <Box
                        component={Link}
                        to="/"
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <Box
                            component="img"
                            src="/images/syntaxtypelogo1.png"
                            alt="SyntaxType"
                            sx={{
                                height: { xs: 32, md: 40 },
                                width: 'auto',
                                display: 'block',
                                filter: 'drop-shadow(0 2px 0 rgba(0,0,0,0.4))',
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
                            <IconButton color="inherit" onClick={toggleMode} aria-label="toggle theme" sx={{ mr: { xs: 0, md: 1 } }}>
                                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                            </IconButton>
                        </Tooltip>

                        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
                            {!isLoggedIn ? (
                                <>
                                    <Button
                                        color="inherit"
                                        component={Link}
                                        to="/login"
                                        startIcon={<LoginIcon />}
                                        sx={{ textTransform: 'none', borderRadius: '0.375rem' }}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        color="inherit"
                                        component={Link}
                                        to="/register"
                                        startIcon={<AppRegistrationIcon />}
                                        sx={{ textTransform: 'none', borderRadius: '0.375rem', ml: 1 }}
                                    >
                                        Register
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    color="inherit"
                                    onClick={handleLogout}
                                    startIcon={<LogoutIcon />}
                                    sx={{ textTransform: 'none', borderRadius: '0.375rem' }}
                                >
                                    Logout
                                </Button>
                            )}
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>
            <Toolbar />

            
        </>
    );
};

export default Navbar;
