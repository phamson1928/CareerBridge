import {
  CompanyStatus,
  CompanyRejectionReasonCode,
  CompanySuspensionReasonCode,
} from '../../src/generated/prisma/client';

export interface CompanySeedItem {
  email: string;
  companyName: string;
  businessRegistrationNumber: string;
  contactPersonName: string;
  contactPhone: string;
  tagline: string;
  description: string;
  industry: string;
  website: string;
  address: string;
  status: CompanyStatus;
  reviewedByAdminRole?: 'SUPER_ADMIN' | 'ACADEMIC_ADMIN' | 'CORPORATE_ADMIN';
  reviewedAt?: Date;
  autoAiScanEnabled?: boolean;
  submittedAt?: Date;
  reviewDueAt?: Date;
  reviewChecklist?: Record<string, boolean>;
  rejectionReasonCode?: CompanyRejectionReasonCode;
  rejectionReason?: string;
  suspensionReasonCode?: CompanySuspensionReasonCode;
  suspensionReason?: string;
  suspendedAt?: Date;
}

export const companiesData: CompanySeedItem[] = [
  // 1. FPT Software - APPROVED
  {
    email: 'fpt.software@fpt.com',
    companyName: 'Công ty TNHH Phần mềm FPT (FPT Software)',
    businessRegistrationNumber: '0101778162',
    contactPersonName: 'Nguyễn Thanh Tùng',
    contactPhone: '02873007575',
    tagline: 'Dẫn đầu chuyển đổi số và công nghệ phần mềm tại Việt Nam',
    description: 'FPT Software là công ty thành viên của Tập đoàn FPT, chuyên cung cấp các giải pháp dịch vụ phần mềm, AI, Cloud và chuyển đổi số cho hàng trăm doanh nghiệp Fortune 500 trên toàn cầu.',
    industry: 'Công nghệ thông tin & Dịch vụ phần mềm',
    website: 'https://fptsoftware.com',
    address: 'F-Town 3, Khu Công nghệ cao TP. Thủ Đức, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-01-20T09:00:00Z'),
    autoAiScanEnabled: true,
  },

  // 2. Bosch Global Software Technologies - APPROVED
  {
    email: 'bosch.recruitment@bosch.com',
    companyName: 'Công ty TNHH Bosch Global Software Technologies Việt Nam',
    businessRegistrationNumber: '0310469871',
    contactPersonName: 'Trần Minh Đức',
    contactPhone: '02862858888',
    tagline: 'Invented for Life - Phát triển phần mềm và kỹ thuật ô tô thông minh',
    description: 'Trung tâm nghiên cứu và phát triển phần mềm công nghệ cao của Tập đoàn Bosch tại Việt Nam, tập trung vào hệ thống nhúng (Embedded Systems), Automotive IoT, AI và giải pháp di chuyển thông minh.',
    industry: 'Kỹ thuật ô tô, Hệ thống nhúng & IoT',
    website: 'https://www.bosch.com.vn',
    address: 'Tòa nhà E-Town Central, 11 Đoàn Văn Bơ, Quận 4, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-01-22T14:30:00Z'),
    autoAiScanEnabled: true,
  },

  // 3. Viettel Solutions - APPROVED
  {
    email: 'viettel.solutions@viettel.com.vn',
    companyName: 'Tổng Công ty Giải pháp Doanh nghiệp Viettel (Viettel Solutions)',
    businessRegistrationNumber: '0100109106',
    contactPersonName: 'Lê Quốc Huy',
    contactPhone: '02462778899',
    tagline: 'Tiên phong kiến tạo xã hội số',
    description: 'Đơn vị thành viên của Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel, chuyên cung cấp hạ tầng số, an toàn thông tin mạng (Cybersecurity), điện toán đám mây và trung tâm điều hành thông minh IOC.',
    industry: 'Viễn thông, An ninh mạng & Dịch vụ số',
    website: 'https://solutions.viettel.vn',
    address: 'Tòa nhà Viettel Complex, 285 Cách Mạng Tháng 8, Quận 10, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-02-05T10:15:00Z'),
    autoAiScanEnabled: true,
  },

  // 4. VinFast Auto - APPROVED
  {
    email: 'vinfast.careers@vinfast.vn',
    companyName: 'Công ty Cổ phần Sản xuất và Kinh doanh VinFast',
    businessRegistrationNumber: '0108035252',
    contactPersonName: 'Phạm Hải Đăng',
    contactPhone: '1900232389',
    tagline: 'Cùng bạn bứt phá mọi giới hạn với xe điện thông minh',
    description: 'Nhà sản xuất ô tô và xe máy điện thông minh toàn cầu thuộc Tập đoàn Vingroup, dẫn đầu về công nghệ pin, trạm sạc và kỹ thuật ô tô điện thế hệ mới.',
    industry: 'Sản xuất Ô tô, Cơ khí chính xác & Năng lượng xanh',
    website: 'https://vinfastauto.com',
    address: 'Khu phức hợp công nghiệp VinFast, Cát Hải, Hải Phòng & VP TP.HCM: Vinhomes Central Park, Bình Thạnh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'ACADEMIC_ADMIN',
    reviewedAt: new Date('2025-02-10T16:00:00Z'),
    autoAiScanEnabled: false,
  },

  // 5. Tân Cảng Sài Gòn (Saigon Newport) - APPROVED
  {
    email: 'saigon.newport@saigonnewport.com.vn',
    companyName: 'Tổng Công ty Tân Cảng Sài Gòn (Saigon Newport Corporation)',
    businessRegistrationNumber: '0300445492',
    contactPersonName: 'Võ Thị Tuyết Mai',
    contactPhone: '02837422234',
    tagline: 'Dẫn đầu dịch vụ khai thác cảng và logistics trọn gói tại Việt Nam',
    description: 'Nhà khai thác cảng container lớn nhất Việt Nam với thị phần hơn 50% cả nước, cung cấp chuỗi dịch vụ logistics đa phương thức, quản lý kho bãi hiện đại và giải pháp chuỗi cung ứng toàn diện.',
    industry: 'Cảng biển, Logistics & Quản lý Chuỗi cung ứng',
    website: 'https://saigonnewport.com.vn',
    address: 'Cảng Cát Lái, Đường Nguyễn Thị Định, Cát Lái, TP. Thủ Đức, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-02-15T11:00:00Z'),
    autoAiScanEnabled: false,
  },

  // 6. VNG Corporation - APPROVED (MỚI)
  {
    email: 'vng.recruitment@vng.com.vn',
    companyName: 'Công ty Cổ phần VNG (VNG Corporation)',
    businessRegistrationNumber: '0303577749',
    contactPersonName: 'Phan Thị Ngọc Mai',
    contactPhone: '02839623888',
    tagline: 'Đón nhận thách thức, phát triển công nghệ phục vụ hàng chục triệu người dùng',
    description: 'Tập đoàn công nghệ Internet và chuyển đổi số hàng đầu Việt Nam, phát triển nền tảng Zalo, ZaloPay, VNGGames, VNG Cloud và các giải pháp AI thế hệ mới.',
    industry: 'Công nghệ Thông tin, Game, Cloud & Trí tuệ Nhân tạo',
    website: 'https://vng.com.vn',
    address: 'Tòa nhà Zalo Campus, Đường số 13, Khu Chế xuất Tân Thuận, Phường Tân Thuận Đông, Quận 7, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-02-18T10:00:00Z'),
    autoAiScanEnabled: true,
  },

  // 7. MoMo (M-Service) - APPROVED (MỚI)
  {
    email: 'momo.careers@mservice.com.vn',
    companyName: 'Công ty Cổ phần Dịch vụ Di động Trực tuyến (MoMo)',
    businessRegistrationNumber: '0305389656',
    contactPersonName: 'Trần Bảo Trâm',
    contactPhone: '02854147667',
    tagline: 'Siêu ứng dụng thanh toán và dịch vụ tài chính số số 1 Việt Nam',
    description: 'Kỳ lân công nghệ Fintech tiên phong tại Việt Nam với hơn 30 triệu người dùng, sở hữu nền tảng xử lý dữ liệu lớn Big Data và hệ thống AI phát hiện gian lận tài chính theo thời gian thực.',
    industry: 'Fintech, Công nghệ Tài chính & Dữ liệu lớn',
    website: 'https://momo.vn',
    address: 'Tầng 6, Tòa nhà Phú Mỹ Hưng, 8 Hoàng Văn Thái, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-02-20T14:00:00Z'),
    autoAiScanEnabled: true,
  },

  // 8. Axon Enterprise Việt Nam - APPROVED (MỚI)
  {
    email: 'axon.careers@axon.com',
    companyName: 'Công ty TNHH Axon Enterprise Việt Nam',
    businessRegistrationNumber: '0314867156',
    contactPersonName: 'Vũ Hoàng Long',
    contactPhone: '02871099688',
    tagline: 'Protect Life - Bảo vệ sinh mạng và cộng đồng bằng công nghệ an ninh đỉnh cao',
    description: 'Trung tâm R&D phần mềm của Tập đoàn Axon (Hoa Kỳ) tại Việt Nam, phát triển giải pháp an ninh công cộng toàn cầu, thiết bị ghi hình AI Camera gắn người, phân tích video thời gian thực và nền tảng đám mây Evidence.com.',
    industry: 'An ninh số, Camera AI & Điện toán Đám mây',
    website: 'https://www.axon.com',
    address: 'Tầng 12, Tòa nhà Deutsches Haus, 33 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-02-22T09:30:00Z'),
    autoAiScanEnabled: true,
  },

  // 9. Shopee Việt Nam - APPROVED (MỚI)
  {
    email: 'shopee.campus@shopee.vn',
    companyName: 'Công ty TNHH Shopee Việt Nam',
    businessRegistrationNumber: '0313447936',
    contactPersonName: 'Nguyễn Hoàng Yến',
    contactPhone: '02873081221',
    tagline: 'Kết nối hàng triệu người mua và người bán qua nền tảng thương mại điện tử thông minh',
    description: 'Nền tảng thương mại điện tử hàng đầu khu vực Đông Nam Á, trực thuộc Tập đoàn Sea. Hệ thống vận hành xử lý hàng triệu giao dịch mỗi giây cùng mạng lưới logistics công nghệ cao SPX Express.',
    industry: 'Thương mại Điện tử, Logistics Số & Hệ thống Phân tán',
    website: 'https://careers.shopee.vn',
    address: 'Tòa nhà Saigon Centre Tower 2, 67 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'CORPORATE_ADMIN',
    reviewedAt: new Date('2025-02-25T15:00:00Z'),
    autoAiScanEnabled: false,
  },

  // 10. Renesas Design Vietnam (RVC) - APPROVED (MỚI)
  {
    email: 'renesas.careers@lm.renesas.com',
    companyName: 'Công ty TNHH Renesas Design Việt Nam (RVC)',
    businessRegistrationNumber: '0303496979',
    contactPersonName: 'Đỗ Văn Tuấn',
    contactPhone: '02837700252',
    tagline: 'Dẫn đầu toàn cầu về giải pháp bán dẫn SoC và vi điều khiển ô tô',
    description: 'Trung tâm thiết kế bán dẫn lớn nhất Đông Nam Á của Tập đoàn Renesas Electronics (Nhật Bản). Chuyên thiết kế và kiểm thử vi mạch LSI phức tạp cho hệ thống xe tự hành, IoT và công nghiệp.',
    industry: 'Thiết kế Vi mạch Bán dẫn VLSI & Hệ thống Nhúng',
    website: 'https://www.renesas.com',
    address: 'Tòa nhà Tân Thuận, Đường Tân Thuận, Khu Chế xuất Tân Thuận, Quận 7, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-02-26T11:00:00Z'),
    autoAiScanEnabled: true,
  },

  // 11. NashTech Việt Nam - APPROVED (MỚI)
  {
    email: 'nashtech.careers@nashtechglobal.com',
    companyName: 'Công ty TNHH NashTech Việt Nam',
    businessRegistrationNumber: '0302176466',
    contactPersonName: 'Trần Mỹ Linh',
    contactPhone: '02838106200',
    tagline: 'Kiến tạo giá trị xuất sắc trong dịch vụ chuyển đổi số và phần mềm quốc tế',
    description: 'Thành viên Tập đoàn công nghệ Harvey Nash (Anh Quốc), chuyên cung cấp giải pháp tư vấn kỹ thuật phần mềm, Cloud Migration, Big Data và AI cho khách hàng tại châu Âu, Bắc Mỹ và Úc.',
    industry: 'Phát triển Phần mềm Quốc tế, Cloud & DevOps',
    website: 'https://nashtechglobal.com',
    address: 'Tầng 3, Tòa nhà E-Town 1, 364 Cộng Hòa, Phường 13, Quận Tân Bình, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'CORPORATE_ADMIN',
    reviewedAt: new Date('2025-02-27T16:00:00Z'),
    autoAiScanEnabled: false,
  },

  // 12. Coteccons - APPROVED (MỚI)
  {
    email: 'coteccons.careers@coteccons.vn',
    companyName: 'Công ty Cổ phần Xây dựng Coteccons',
    businessRegistrationNumber: '0303443233',
    contactPersonName: 'Lâm Hữu Phúc',
    contactPhone: '02835142255',
    tagline: 'Tổng thầu xây dựng biểu tượng - Tiên phong ứng dụng mô hình số BIM',
    description: 'Tập đoàn xây dựng hàng đầu Việt Nam, tổng thầu thi công siêu cao ốc Landmark 81 và hàng trăm tổ hợp đô thị hiện đại. Đi đầu ứng dụng công nghệ BIM, vật liệu xanh và chuyển đổi số xây dựng.',
    industry: 'Xây dựng Dân dụng & Công nghiệp, Kết cấu & Mô hình BIM',
    website: 'https://coteccons.vn',
    address: 'Tòa nhà Coteccons, 236/6 Điện Biên Phủ, Phường 17, Quận Bình Thạnh, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'ACADEMIC_ADMIN',
    reviewedAt: new Date('2025-03-01T10:00:00Z'),
    autoAiScanEnabled: false,
  },

  // 13. Unilever Việt Nam - APPROVED (MỚI)
  {
    email: 'unilever.careers@unilever.com',
    companyName: 'Công ty TNHH Quốc tế Unilever Việt Nam',
    businessRegistrationNumber: '0302484390',
    contactPersonName: 'Lê Khánh Hà',
    contactPhone: '02854135686',
    tagline: 'Định hình tương lai tươi sáng và bền vững cho hàng triệu gia đình',
    description: 'Tập đoàn đa quốc gia hàng đầu ngành hàng tiêu dùng nhanh (FMCG) với các thương hiệu OMO, Sunlight, Knorr, Dove, Lifebuoy. Hệ thống nhà máy thông minh đạt chuẩn sản xuất thế giới WCM.',
    industry: 'FMCG, Kỹ thuật Hóa học, Công nghệ Thực phẩm & Chuỗi cung ứng',
    website: 'https://unilever.com.vn',
    address: 'Tòa nhà Unilever, 156 Nguyễn Lương Bằng, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh & Nhà máy KCN Tây Bắc Củ Chi',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2025-03-05T14:00:00Z'),
    autoAiScanEnabled: false,
  },

  // 14. Vinamilk - APPROVED (MỚI)
  {
    email: 'vinamilk.careers@vinamilk.com.vn',
    companyName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    businessRegistrationNumber: '0300588569',
    contactPersonName: 'Bùi Thị Thu Hiền',
    contactPhone: '02854155555',
    tagline: 'Vươn cao Việt Nam - Dinh dưỡng chuẩn quốc tế từ nhà máy siêu hiện đại',
    description: 'Doanh nghiệp sữa hàng đầu Việt Nam thuộc Top 40 công ty sữa lớn nhất thế giới. Sở hữu Siêu nhà máy sữa Mega Plant Bình Dương tự động hóa 100% bằng robot LGV và công nghệ chế biến tiệt trùng chuẩn quốc tế.',
    industry: 'Chế biến Thực phẩm, Tự động hóa Công nghiệp & Quản lý Chất lượng',
    website: 'https://vinamilk.com.vn',
    address: '10 Tân Trào, Phường Tân Phú, Quận 7, TP. Hồ Chí Minh & Mega Plant KCN Mỹ Phước 2, Bến Cát, Bình Dương',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'ACADEMIC_ADMIN',
    reviewedAt: new Date('2025-03-10T09:00:00Z'),
    autoAiScanEnabled: false,
  },

  // 15. SmartLog - APPROVED (MỚI)
  {
    email: 'smartlog.hr@gosmartlog.com',
    companyName: 'Công ty Cổ phần Giải pháp Chuỗi Cung ứng SmartLog',
    businessRegistrationNumber: '0313437148',
    contactPersonName: 'Huỳnh Trung Kiên',
    contactPhone: '02862743843',
    tagline: 'Số hóa Logistics toàn diện - Nền tảng WMS và TMS thế hệ mới',
    description: 'Đơn vị tiên phong chuyển đổi số chuỗi cung ứng tại Việt Nam, cung cấp hệ thống quản lý kho WMS, quản lý vận tải TMS và sàn giao dịch vận tải phục vụ hàng ngàn doanh nghiệp logistics.',
    industry: 'Logistics Số, Quản trị Kho vận & Chuỗi cung ứng',
    website: 'https://gosmartlog.com',
    address: '60 Nguyễn Văn Thủ, Phường Đa Kao, Quận 1, TP. Hồ Chí Minh',
    status: CompanyStatus.APPROVED,
    reviewedByAdminRole: 'CORPORATE_ADMIN',
    reviewedAt: new Date('2025-03-12T15:30:00Z'),
    autoAiScanEnabled: false,
  },

  // 16. KMS Technology - PENDING
  {
    email: 'kms.recruitment@kms-technology.com',
    companyName: 'Công ty TNHH Phần mềm KMS Technology Việt Nam',
    businessRegistrationNumber: '0309538742',
    contactPersonName: 'Hoàng Trọng Nghĩa',
    contactPhone: '02838486994',
    tagline: 'Engineering Excellence - Phần mềm đẳng cấp thế giới',
    description: 'KMS Technology cung cấp dịch vụ kỹ thuật phần mềm, kiểm thử phần mềm tự động hóa và phát triển sản phẩm công nghệ cho thị trường Hoa Kỳ và toàn cầu.',
    industry: 'Phát triển & Kiểm thử phần mềm (QA)',
    website: 'https://kms-technology.com',
    address: '2 Tản Viên, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh',
    status: CompanyStatus.PENDING,
    submittedAt: new Date('2026-11-02T10:00:00Z'),
    reviewDueAt: new Date('2026-11-09T17:00:00Z'),
    reviewChecklist: {
      legalRepresentativeVerified: true,
      businessRegistrationDocumentClear: true,
      addressVerified: true,
      fieldAlignedWithEducation: true,
    },
  },

  // 17. Base Enterprise (Base.vn) - PENDING (MỚI)
  {
    email: 'base.recruitment@base.vn',
    companyName: 'Công ty Cổ phần Base Enterprise (Base.vn)',
    businessRegistrationNumber: '0107530663',
    contactPersonName: 'Nguyễn Hồng Quân',
    contactPhone: '02871077799',
    tagline: 'Nền tảng quản trị doanh nghiệp SaaS hàng đầu Đông Nam Á',
    description: 'Nền tảng B2B SaaS hỗ trợ chuyển đổi số vận hành, nhân sự và tài chính cho hơn 9,000 doanh nghiệp Việt Nam.',
    industry: 'Phần mềm B2B SaaS & Quản trị Doanh nghiệp',
    website: 'https://base.vn',
    address: 'Tầng 8, Tòa nhà Báo Phụ Nữ, 20 Nguyễn Đăng Giai, Phường Thảo Điền, TP. Thủ Đức, TP. Hồ Chí Minh',
    status: CompanyStatus.PENDING,
    submittedAt: new Date('2026-11-05T09:00:00Z'),
    reviewDueAt: new Date('2026-11-12T17:00:00Z'),
    reviewChecklist: {
      legalRepresentativeVerified: true,
      businessRegistrationDocumentClear: true,
      addressVerified: true,
      fieldAlignedWithEducation: true,
    },
  },

  // 18. Công ty Alpha VN - REJECTED
  {
    email: 'alpha.tech@alphavn.com',
    companyName: 'Công ty Cổ phần Đầu tư Công nghệ Alpha Việt Nam',
    businessRegistrationNumber: '0319988771',
    contactPersonName: 'Vũ Đức Thắng',
    contactPhone: '0938999888',
    tagline: 'Giải pháp thương mại điện tử nhanh chóng',
    description: 'Công ty mới thành lập chuyên phát triển các website bán hàng và ứng dụng marketing.',
    industry: 'Thương mại điện tử & Dịch vụ trực tuyến',
    website: 'https://alphavn-demo.local',
    address: '45/12 Đường Số 8, Linh Xuân, TP. Thủ Đức, TP. Hồ Chí Minh',
    status: CompanyStatus.REJECTED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2026-10-25T14:00:00Z'),
    rejectionReasonCode: CompanyRejectionReasonCode.DOCUMENT_UNCLEAR,
    rejectionReason: 'Bản scan Giấy chứng nhận đăng ký doanh nghiệp bị mờ, không hiển thị rõ mã số thuế và con dấu pháp nhân. Vui lòng cập nhật bản scan rõ nét để được xem xét lại.',
    submittedAt: new Date('2026-10-24T09:00:00Z'),
  },

  // 19. Công ty NextGen - SUSPENDED
  {
    email: 'nextgen.hr@nextgensolutions.vn',
    companyName: 'Công ty Cổ phần Giải pháp Số NextGen',
    businessRegistrationNumber: '0318877665',
    contactPersonName: 'Trịnh Hoài Nam',
    contactPhone: '0912334455',
    tagline: 'Phần mềm và truyền thông đa phương tiện',
    description: 'Công ty tư vấn phần mềm và giải pháp chuyển đổi số.',
    industry: 'Công nghệ thông tin',
    website: 'https://nextgensolutions.local',
    address: '128 Điện Biên Phủ, Phường 15, Bình Thạnh, TP. Hồ Chí Minh',
    status: CompanyStatus.SUSPENDED,
    reviewedByAdminRole: 'SUPER_ADMIN',
    reviewedAt: new Date('2026-03-01T08:00:00Z'),
    suspendedAt: new Date('2026-10-15T16:30:00Z'),
    suspensionReasonCode: CompanySuspensionReasonCode.ABUSIVE_POSTING,
    suspensionReason: 'Doanh nghiệp đăng tải tin tuyển dụng sai lệch thực tế và yêu cầu sinh viên thực tập đóng phí đào tạo trái với quy định của nhà trường.',
  },

  // 20. Công ty Tân Phú Startup - DRAFT
  {
    email: 'tanphu.startup@tanphutech.vn',
    companyName: 'Công ty TNHH Khởi nghiệp Công nghệ Tân Phú',
    businessRegistrationNumber: '0317766554',
    contactPersonName: 'Đinh Quốc Hưng',
    contactPhone: '0988112233',
    tagline: 'Giải pháp số cho nông nghiệp thông minh',
    description: 'Startup nghiên cứu cảm biến IoT và ứng dụng điều khiển tưới tiêu tự động trong nông nghiệp.',
    industry: 'IoT Nông nghiệp & Công nghệ phần cứng',
    website: 'https://tanphuiot.local',
    address: '77 Thoại Ngọc Hầu, Phú Thạnh, Tân Phú, TP. Hồ Chí Minh',
    status: CompanyStatus.DRAFT,
  },
];
