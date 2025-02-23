import React, { useState } from "react";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";

const InviteModal = ({ open, onClose, groupId }) => {
  const [email, setEmail] = useState("");

  const handleInvite = () => {
    // Send invite logic here
    console.log(`Inviting ${email} to group ${groupId}`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          p: 4,
          bgcolor: "background.paper",
          margin: "auto",
          maxWidth: 400,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Invite to Group
        </Typography>
        <TextField
          label="Email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="contained" onClick={handleInvite}>
          Send Invite
        </Button>
      </Box>
    </Modal>
  );
};

export default InviteModal;
