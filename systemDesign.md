Internship Management Platform

1. Tổng quan đề tài
   Mục tiêu

Xây dựng một hệ thống quản lý quá trình thực tập dành cho sinh viên, giúp kết nối và quản lý giữa:

Sinh viên
Doanh nghiệp
Giảng viên hướng dẫn
Nhà trường/Admin

Hệ thống hỗ trợ toàn bộ vòng đời thực tập:

Sinh viên đăng ký
|
|
Khai báo nơi thực tập / ứng tuyển
|
|
Doanh nghiệp xác nhận
|
|
Admin phân công giảng viên
|
|
Sinh viên gửi báo cáo
|
|
Giảng viên đánh giá
|
|
Hoàn thành thực tập 2. Actor trong hệ thống

Có 4 role chính:

ADMIN

STUDENT

COMPANY

LECTURER 3. Nghiệp vụ chính
3.1 Student (Sinh viên)

Sinh viên có thể:

Quản lý hồ sơ

Thông tin:

Họ tên
MSSV
Ngành học
Kỹ năng
CV

Ví dụ:

Phạm Hoàng Sơn

Major:
Software Engineering

Skills:
NestJS
React
PostgreSQL
Docker
Tìm kiếm thực tập

Xem các vị trí:

Backend Developer Intern

Company:
ABC Technology

Requirement:

- NodeJS
- PostgreSQL
- REST API

Deadline:
30/08/2026
Ứng tuyển

Flow:

Student

Apply

↓

Company Review

↓

Accepted / Rejected
Theo dõi thực tập

Sau khi được nhận:

Xem thông tin công ty
Xem giảng viên hướng dẫn
Gửi báo cáo tuần
Nhận đánh giá
3.2 Company (Doanh nghiệp)

Doanh nghiệp:

Tạo bài đăng thực tập

Ví dụ:

Position:

Backend Intern

Requirement:

NestJS
Database
Docker

Quantity:

3
Quản lý ứng viên

Xem:

Applicant:

Phạm Hoàng Sơn

CV

Skills

Projects

Có thể:

Accept

Reject
Đánh giá sinh viên

Sau kỳ thực tập:

Nhận xét
Điểm đánh giá
3.3 Lecturer (Giảng viên)

Giảng viên không tự chọn sinh viên.

Quan hệ được tạo bởi Admin.

Ví dụ:

ADMIN

Assign

Nguyễn Văn A (Lecturer)

        |

        |

---

| | |

Sơn Nam Hùng

Giảng viên:

Xem sinh viên phụ trách
Xem báo cáo
Comment
Đánh giá
3.4 Admin

Admin quản lý toàn hệ thống.

Chức năng:

User management
Student
Lecturer
Company
Company verification

Công ty đăng ký:

PENDING

↓

APPROVED

↓

Can post internship
Lecturer assignment

Phân công:

Student

        |

        |

Lecturer
Dashboard

Thống kê:

Total students

Total companies

Active internships

Completion rate

4.  Kiến trúc hệ thống
    React Frontend

                     |

                     |

               NestJS Backend

                     |

         -----------------------

         |          |          |

    PostgreSQL Redis Storage

    Prisma Supabase

5.  Technology Stack
    Backend
    NestJS
    TypeScript
    Prisma ORM
    JWT Authentication
    RBAC
    Database
    PostgreSQL
    Cache
    Redis

Dùng cho:

Cache
Rate limit
Notification realtime
File Storage
Supabase Storage

Lưu:

CV
Report
Certificate
Deployment
Docker

Nginx

VPS

GitHub Actions 6. Backend Architecture NestJS
src

├── auth

├── users

├── students

├── lecturers

├── companies

├── internships

├── applications

├── supervision

├── reports

├── evaluations

├── notifications

├── files

├── dashboard

└── prisma

7. Database Design
   Core tables
   User

Tài khoản chung.

users

id

email

password_hash

role

status

created_at

Role:

ADMIN
STUDENT
LECTURER
COMPANY
RefreshToken

Quản lý login.

refresh_tokens

id

user_id

token

expires_at

revoked
StudentProfile
student_profiles

id

user_id

student_code

full_name

major

cv_url
LecturerProfile
lecturer_profiles

id

user_id

full_name

department
CompanyProfile
company_profiles

id

user_id

company_name

description

status

Status:

PENDING

APPROVED

REJECTED
Internship

Doanh nghiệp đăng vị trí.

internships

id

company_id

title

description

requirements

deadline

status

Status:

DRAFT

OPEN

CLOSED
Application

Sinh viên ứng tuyển.

applications

id

student_id

internship_id

status

created_at

Status:

PENDING

ACCEPTED

REJECTED
Supervision ⭐

Quan hệ sinh viên - giảng viên.

Admin tạo.

supervisions

id

student_id

lecturer_id

semester_id

status

Ví dụ:

Sơn

|

Thầy Nguyễn Văn A

Semester

Quản lý kỳ thực tập.

semesters

id

name

start_date

end_date

status

Ví dụ:

2026 Summer Internship
Report

Sinh viên gửi báo cáo.

reports

id

student_id

week

content

file_url

status

Flow:

Submit

↓

Lecturer Review

↓

Approved
Evaluation

Đánh giá.

evaluations

id

student_id

company_score

lecturer_score

comment
File

Quản lý file.

files

id

owner_id

type

url

created_at

Type:

CV

REPORT

CERTIFICATE
Notification

Thông báo.

notifications

id

user_id

title

content

is_read
Audit Log

Lưu lịch sử.

audit_logs

id

user_id

action

entity

created_at 8. API Modules
Auth
POST /auth/register

POST /auth/login

POST /auth/refresh

POST /auth/logout
Student
GET /students/profile

PATCH /students/profile

GET /internships

POST /applications
Company
POST /internships

GET /applications

PATCH /applications/:id/status
Admin
GET /admin/users

POST /admin/supervisions

PATCH /admin/company/:id/verify
Lecturer
GET /lecturer/students

GET /reports

PATCH /reports/:id/review 9. Feature ưu tiên triển khai
Phase 1 (Bắt buộc)
Authentication

RBAC

User management

Student profile

Company profile

Internship

Application
Phase 2
Supervision

Report

Evaluation

File upload
Phase 3
Notification

Dashboard

Redis

Realtime chat
Phase 4 (Optional)
AI CV matching

Recommendation system 10. Database cuối cùng

Tổng:

Khoảng 19 bảng:

users

refresh_tokens

student_profiles

lecturer_profiles

company_profiles

semesters

internships

skills

student_skills

internship_skills

applications

application_status_history

supervisions

reports

evaluations

files

messages

notifications

audit_logs 11. Tên project
Chọn:
InternHub

Ý nghĩa:

Internship + Hub

Repo:

internhub-backend

internhub-frontend

CV:

InternHub - Internship Management Platform

Tech:
NestJS, PostgreSQL, Prisma, React,
Redis, Docker
