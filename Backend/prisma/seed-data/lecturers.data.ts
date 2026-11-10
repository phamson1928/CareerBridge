export interface LecturerSeedItem {
  email: string;
  fullName: string;
  facultyCode: string;
  department: string;
  title: string;
}

export const lecturersData: LecturerSeedItem[] = [
  // 1. Khoa Khoa học và Kỹ thuật Máy tính (BK-CSE)
  {
    email: 'lecturer.cse@careerbridge.edu.vn',
    fullName: 'PGS.TS. Phạm Hoàng Anh',
    facultyCode: 'BK-CSE',
    department: 'Khoa Khoa học và Kỹ thuật Máy tính',
    title: 'Phó Giáo sư, Giảng viên cao cấp',
  },
  {
    email: 'lecturer.cse2@careerbridge.edu.vn',
    fullName: 'TS. Quản Thành Thơ',
    facultyCode: 'BK-CSE',
    department: 'Khoa Khoa học và Kỹ thuật Máy tính',
    title: 'Tiến sĩ, Trưởng bộ môn Kỹ thuật Phần mềm',
  },

  // 2. Khoa Điện - Điện tử (BK-FEEE)
  {
    email: 'lecturer.feee@careerbridge.edu.vn',
    fullName: 'TS. Đỗ Quốc Thắng',
    facultyCode: 'BK-FEEE',
    department: 'Khoa Điện - Điện tử',
    title: 'Tiến sĩ, Trưởng bộ môn Vi mạch',
  },
  {
    email: 'lecturer.feee2@careerbridge.edu.vn',
    fullName: 'TS. Huỳnh Phú Minh Cường',
    facultyCode: 'BK-FEEE',
    department: 'Khoa Điện - Điện tử',
    title: 'Tiến sĩ, Trưởng bộ môn Kỹ thuật Điện',
  },

  // 3. Khoa Cơ khí (BK-FME)
  {
    email: 'lecturer.fme@careerbridge.edu.vn',
    fullName: 'TS. Nguyễn Thanh Tùng',
    facultyCode: 'BK-FME',
    department: 'Khoa Cơ khí',
    title: 'Tiến sĩ, Giảng viên chính Cơ điện tử',
  },
  {
    email: 'lecturer.fme2@careerbridge.edu.vn',
    fullName: 'TS. Lê Thanh Long',
    facultyCode: 'BK-FME',
    department: 'Khoa Cơ khí',
    title: 'Tiến sĩ, Giảng viên Bộ môn Robot & Tự động hóa',
  },

  // 4. Khoa Quản lý Công nghiệp (BK-SIM)
  {
    email: 'lecturer.sim@careerbridge.edu.vn',
    fullName: 'ThS. Lê Hoàng Mai',
    facultyCode: 'BK-SIM',
    department: 'Khoa Quản lý Công nghiệp',
    title: 'Thạc sĩ, Giảng viên Chuỗi cung ứng & Logistics',
  },

  // 5. Khoa Kỹ thuật Hóa học (BK-FCE)
  {
    email: 'lecturer.fce@careerbridge.edu.vn',
    fullName: 'TS. Bùi Minh Triết',
    facultyCode: 'BK-FCE',
    department: 'Khoa Kỹ thuật Hóa học',
    title: 'Tiến sĩ, Giảng viên Công nghệ Thực phẩm',
  },
  {
    email: 'lecturer.fce2@careerbridge.edu.vn',
    fullName: 'PGS.TS. Huỳnh Kỳ Phương Chu',
    facultyCode: 'BK-FCE',
    department: 'Khoa Kỹ thuật Hóa học',
    title: 'Phó Giáo sư, Giảng viên cao cấp Kỹ thuật Hóa học',
  },

  // 6. Khoa Kỹ thuật Xây dựng (BK-CIVIL)
  {
    email: 'lecturer.civil@careerbridge.edu.vn',
    fullName: 'PGS.TS. Nguyễn Danh Thảo',
    facultyCode: 'BK-CIVIL',
    department: 'Khoa Kỹ thuật Xây dựng',
    title: 'Phó Giáo sư, Giảng viên cao cấp Kỹ thuật Xây dựng & Công trình biển',
  },
];
