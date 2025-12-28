export default function isLocalhost(): boolean {
  return ['localhost', '0.0.0.0', '127.0.0.1'].includes(
    window.location.hostname
  )
}
