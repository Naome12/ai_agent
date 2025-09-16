import crypto from 'crypto';

export function randomToken(length = 48) {
  return crypto.randomBytes(length).toString('hex'); // raw token (send to user)
}
export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex'); // store hash only
}