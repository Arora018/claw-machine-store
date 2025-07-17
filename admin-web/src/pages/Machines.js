import React from 'react';
import { Typography, Paper, Box } from '@mui/material';

const Machines = () => (
  <Box>
    <Typography variant="h4" gutterBottom>Machine Management</Typography>
    <Paper sx={{ p: 3 }}>
      <Typography>Claw machine status, coin counts, and toy counts will be managed here</Typography>
    </Paper>
  </Box>
);

export default Machines;
