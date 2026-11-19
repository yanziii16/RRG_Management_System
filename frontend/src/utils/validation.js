function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13;
}
function validatePassword(password) {
  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  return null;
}
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
function validateImageFile(file) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
    return "Unsupported format. Please upload JPG, JPEG, PNG, or WEBP images.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "File is too large. Maximum size allowed is 5 MB.";
  }
  return null;
}
export {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  isValidEmail,
  isValidPhone,
  validateImageFile,
  validatePassword
};
