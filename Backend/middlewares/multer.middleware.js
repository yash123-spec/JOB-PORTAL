import multer from "multer";

// Store file in memory for direct Cloudinary upload
const storage = multer.memoryStorage();

// Accept only PDF and DOCX files for resumes
const resumeFileFilter = (req, file, cb) => {
  const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and DOCX files are allowed!"), false);
  }
};

// Accept only image files for profile pictures
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, JPG, PNG, and WEBP images are allowed!"), false);
  }
};

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

export const uploadResume = multer({
  storage,
  fileFilter: resumeFileFilter,
  limits: { fileSize: MAX_RESUME_SIZE },
});

export const uploadProfilePicture = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
});
