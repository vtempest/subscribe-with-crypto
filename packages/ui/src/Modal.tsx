import { Box, Modal, type ModalOwnProps, type SxProps } from '@mui/material'
import type { FC, ReactNode } from 'react'

interface CustomModalProps {
  open: boolean
  onClose: () => void
  sx?: SxProps
  children: ReactNode
  disableCloseOnBackdrop?: boolean
}

const CustomModal: FC<CustomModalProps> = ({ open, onClose, sx, disableCloseOnBackdrop, children }) => {
  const handleClose: ModalOwnProps['onClose'] = (_e, reason) => {
    if (disableCloseOnBackdrop && (reason === 'backdropClick' || reason === 'escapeKeyDown')) return
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} BackdropProps={{ invisible: true }}>
      <Box
        sx={{
          position: 'absolute' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 600,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
          ...sx,
        }}
      >
        {children}
      </Box>
    </Modal>
  )
}

export default CustomModal
