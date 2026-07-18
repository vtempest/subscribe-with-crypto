import RefreshIcon from '@mui/icons-material/Refresh'
import { Button, type ButtonProps } from '@mui/material'
import type { FC, ReactNode } from 'react'

interface CustomButtonProps extends ButtonProps {
  loading?: boolean
  text: string
  icon?: ReactNode
}

const CustomButton: FC<CustomButtonProps> = ({ loading, text, icon, disabled, onClick, ...rest }) => (
  <Button
    onClick={onClick}
    variant="contained"
    startIcon={
      loading ? (
        <RefreshIcon
          sx={{
            animation: 'spin 1s linear infinite',
            '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
          }}
        />
      ) : (
        icon
      )
    }
    disabled={loading || disabled}
    {...rest}
  >
    {text}
  </Button>
)

export default CustomButton
