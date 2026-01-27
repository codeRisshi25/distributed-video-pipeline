import crypto from "crypto";
import { readFileSync } from "fs";

export const fileHash = (filePath) => {
  const file = readFileSync(filePath);
  const hashSum = crypto.createHash("md5");
  hashSum.update(file);
  return hashSum.digest("hex");
};
