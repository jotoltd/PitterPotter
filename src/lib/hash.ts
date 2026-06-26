import { sha256 as jsSha256 } from 'js-sha256';

export async function sha256(input: string): Promise<string> {
  return jsSha256(input);
}
