import axios, { AxiosError } from 'axios'

export const handleApiError = (error: unknown): { status: number | undefined; message: string } => {
  const GENERIC = 'An unknown error occurred'
  console.error(error)
  if (axios.isAxiosError(error)) {
    if (error.code === AxiosError.ERR_NETWORK) {
      return { status: 500, message: 'Server Network Error' }
    }
    return { status: error.status, message: error.response?.data?.error ?? GENERIC }
  }
  return { status: 400, message: GENERIC }
}
