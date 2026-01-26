import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const fileFilter = (req, file, cb) => {
  console.log("📁 File mimetype:", file.mimetype);
  cb(null, true); // Accept everything for now
};

const limits = {
  fileSize: 100 * 1024 * 1024,
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});
