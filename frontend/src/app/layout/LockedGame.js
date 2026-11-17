// app/layout/LockedGame.js
// Shown in place of a locked game (see shared/games/gameLocks.js), so a saved
// link says why the game won't open and where to go instead.
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { OPEN_GAMES } from '../../shared/games/gameLocks';

const LockedGame = ({ name }) => (
    <Box component="main" sx={{ display: 'flex', justifyContent: 'center', px: 2, py: { xs: 5, md: 10 } }}>
        <Card sx={{ width: '100%', maxWidth: 480 }}>
            <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <LockIcon aria-hidden sx={{ fontSize: 44, color: 'text.secondary', mb: 1 }} />
                <Typography variant="h4" component="h1" sx={{ color: 'text.primary', mb: 1, fontSize: { xs: '1.6rem', sm: '2rem' } }}>
                    {name} is locked
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 3 }}>
                    For now, you can play these games:
                </Typography>
                <Stack spacing={1.5}>
                    {OPEN_GAMES.map((game) => (
                        <Button key={game.path} component={RouterLink} to={game.path} variant="contained">
                            {game.name}
                        </Button>
                    ))}
                    <Button component={RouterLink} to="/dashboard" sx={{ color: 'text.secondary' }}>
                        Back to dashboard
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    </Box>
);

export default LockedGame;
