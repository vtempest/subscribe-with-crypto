import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import type { SxProps } from '@mui/material'
import type { FC } from 'react'
import { useState } from 'react'

interface DisplayFieldProps {
  label: string
  text: string | undefined
  hideOption?: boolean
  sx?: SxProps
}

const DisplayField: FC<DisplayFieldProps> = ({ label, text = '', hideOption = false, sx }) => {
  const [visible, setVisible] = useState(!hideOption)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <TextField
      label={label}
      value={visible ? text : '***********************'}
      InputProps={{
        readOnly: true,
        endAdornment: (
          <InputAdornment position="end">
            {hideOption && (
              <IconButton onClick={() => setVisible((v) => !v)}>
                {visible ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            )}
            <Tooltip open={copied} title="Copied to clipboard!" placement="top">
              <IconButton onClick={handleCopy}>
                <FileCopyOutlinedIcon />
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
      fullWidth
      sx={sx ?? { mb: 2 }}
    />
  )
}

export default DisplayField
