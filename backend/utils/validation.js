const validateRegister = (data) => {
  const { fullName, studentId, email, password } = data;

  if (!fullName || fullName.trim().length < 2) {
    return 'Họ tên phải có ít nhất 2 ký tự';
  }

  if (!studentId || studentId.trim().length < 5) {
    return 'Mã số sinh viên phải có ít nhất 5 ký tự';
  }

  if (!email || !email.includes('@')) {
    return 'Email không hợp lệ';
  }

  if (!password || password.length < 5) {
    return 'Mật khẩu phải có ít nhất 5 ký tự';
  }

  return null; // Không có lỗi
};

module.exports = { validateRegister };