export const splitTextByCaps = (text: string): string => {
  const words = text.split(/(?=[A-Z])/)
  return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export const formatDate = (dateString: Date | null | undefined): string => {
  const date = new Date(dateString ?? new Date())
  const day = date.getDate()
  const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

export const capitalizeFirstLetter = (str: string): string =>
  `${str.charAt(0).toUpperCase()}${str.slice(1)}`

/** Shortens an EVM address: 0x1234...abcd */
export const shortenAddress = (address: string): string =>
  `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
