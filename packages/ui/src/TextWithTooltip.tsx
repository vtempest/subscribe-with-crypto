import { Tooltip } from '@mui/material'
import type { FC } from 'react'

interface TextWithTooltipProps {
  text: string
  shortened?: boolean
}

const TextWithTooltip: FC<TextWithTooltipProps> = ({ text, shortened }) => (
  <Tooltip title={text}>
    {shortened ? (
      <span>{`${text.substring(0, 4)}...${text.substring(text.length - 4)}`}</span>
    ) : (
      <span>{text}</span>
    )}
  </Tooltip>
)

export default TextWithTooltip
