# รายงานตรวจสอบความปลอดภัย

**โครงการ:** CannabisPOS  
**วันที่ตรวจ:** 9 สิงหาคม 2026  
**ขอบเขต:** `server/src`, `server/prisma`, `src` และจุดเชื่อมต่อหลักของแอปพลิเคชัน  
**วิธีตรวจ:** Static source audit แบบ read-only โดยติดตาม entry point, authentication, authorization, tenant boundary และ sensitive operations

## สรุปผู้บริหาร

พบช่องโหว่ที่ควรเร่งแก้ไข 8 รายการ โดยมี 3 รายการระดับ Critical และ 4 รายการระดับ High หากระบบเปิดใช้งานตามโค้ดปัจจุบัน ผู้โจมตีอาจเข้าถึง management API โดยไม่ต้องมีบัญชี ปลอม JWT ล้างข้อมูลธุรกรรม หรือจัดการบัญชีผู้ใช้และ tenant อื่นได้

## รายการช่องโหว่

### SEC-001 — Management API ไม่มีการยืนยันตัวตนหรือสิทธิ์

- **ระดับ:** Critical
- **CWE:** CWE-306, CWE-862
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/src/server.ts:60-67`](F:/CannabisPOS/server/src/server.ts:60), [`server/src/routes/management.ts:258-304`](F:/CannabisPOS/server/src/routes/management.ts:258), [`server/src/routes/management.ts:600-673`](F:/CannabisPOS/server/src/routes/management.ts:600)
- **รายละเอียด:** `/api/management` ถูก mount ก่อน `authenticateToken` และไม่มี `requirePermission` ภายใน router
- **ผลกระทบ:** ผู้โจมตีที่เข้าถึง HTTP API ได้สามารถอ่านข้อมูลทุก tenant สร้าง tenant เปลี่ยนสถานะร้าน reset password และ broadcast ข้ามร้าน
- **แนวทางแก้:** ย้าย router หลัง authentication และบังคับ `SUPER_ADMIN`/permission เฉพาะ operation ทุก endpoint

### SEC-002 — JWT secret มีค่า fallback ที่เดาได้

- **ระดับ:** Critical
- **CWE:** CWE-321, CWE-798
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/src/middleware/auth.ts:4`](F:/CannabisPOS/server/src/middleware/auth.ts:4), [`server/src/middleware/auth.ts:21-27`](F:/CannabisPOS/server/src/middleware/auth.ts:21)
- **รายละเอียด:** เมื่อ `JWT_SECRET` ไม่ถูกตั้ง ระบบใช้ค่า `your-secret-key-change-in-production`
- **ผลกระทบ:** ผู้โจมตีสามารถสร้าง JWT ปลอมเป็น `SUPER_ADMIN` หรือระบุ `tenantId` เองได้
- **แนวทางแก้:** ยกเลิก fallback, fail startup เมื่อ secret ขาด, ใช้ secret manager และหมุนคีย์ทันทีหากเคย deploy ด้วยค่า fallback

### SEC-003 — Credential ฐานข้อมูลถูกเก็บในไฟล์ที่ tracked

- **ระดับ:** Critical (หาก credential ยังใช้งานจริง)
- **CWE:** CWE-798
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/.env.example:1-3`](F:/CannabisPOS/server/.env.example:1)
- **รายละเอียด:** ไฟล์ตัวอย่างที่อยู่ใน Git มี connection string พร้อม username/password และ database host
- **ผลกระทบ:** ผู้ที่อ่าน repository อาจเชื่อมต่อฐานข้อมูลโดยตรงและเข้าถึงข้อมูลทุก tenant
- **แนวทางแก้:** ถือว่า credential รั่วแล้ว, rotate/revoke ทันที, ลบ secret ออกจากไฟล์และ Git history, ใช้ secret manager และเก็บตัวอย่างเป็น placeholder เท่านั้น

### SEC-004 — Socket.IO ให้เข้าห้อง tenant ใดก็ได้โดยไม่ตรวจ token

- **ระดับ:** High
- **CWE:** CWE-639, CWE-284
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/src/services/SocketService.ts:31-41`](F:/CannabisPOS/server/src/services/SocketService.ts:31), [`server/src/services/SocketService.ts:49-59`](F:/CannabisPOS/server/src/services/SocketService.ts:49)
- **รายละเอียด:** client ส่ง `join_room` พร้อม `tenantId` ใดก็ได้ และ server join room โดยไม่ตรวจ JWT หรือความสัมพันธ์ user–tenant
- **ผลกระทบ:** อ่าน notification และข้อมูล realtime ของร้านอื่น
- **แนวทางแก้:** ตรวจ JWT ตอน handshake, derive tenant จาก token เท่านั้น, ห้ามรับ tenant identity จาก client และแยก user room ให้ถูกต้อง

### SEC-005 — ผู้ใช้ที่ login แล้วสามารถล้างข้อมูลธุรกรรมทั้ง tenant

- **ระดับ:** High
- **CWE:** CWE-863
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/src/server.ts:90-114`](F:/CannabisPOS/server/src/server.ts:90)
- **รายละเอียด:** `POST /api/reset` มีเพียง authentication และ tenant resolution ไม่มี role/permission check
- **ผลกระทบ:** cashier/viewer หรือผู้ใช้ role ต่ำสามารถลบ sales, bills, items และ stock movements ทั้งหมดแบบถาวร
- **แนวทางแก้:** เพิ่ม permission เฉพาะสำหรับ reset, จำกัด role, ใช้ re-authentication/confirmation และบันทึก audit log

### SEC-006 — User management เป็น IDOR และ privilege escalation

- **ระดับ:** High
- **CWE:** CWE-639, CWE-862
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/src/routes/users.ts:21-39`](F:/CannabisPOS/server/src/routes/users.ts:21), [`server/src/routes/users.ts:119-167`](F:/CannabisPOS/server/src/routes/users.ts:119), [`server/src/routes/users.ts:231-243`](F:/CannabisPOS/server/src/routes/users.ts:231)
- **รายละเอียด:** `GET/PUT/DELETE /api/users/:id` ไม่มี `requirePermission`; PUT รับ `role`, `isActive`, `password` และอัปเดตทั้ง tenant DB กับ management DB
- **ผลกระทบ:** ผู้ใช้ทั่วไปอาจยกระดับสิทธิ์ รีเซ็ตรหัสผ่าน ปิดใช้งาน หรือลบบัญชีอื่น
- **แนวทางแก้:** บังคับ `MANAGE_USERS`, อนุญาต self-service เฉพาะฟิลด์ปลอดภัย และตรวจ target user/tenant ทุกครั้ง

### SEC-007 — บัญชีเริ่มต้นใช้รหัสผ่าน hardcoded

- **ระดับ:** Medium
- **CWE:** CWE-798
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/prisma/seed.ts:47-69`](F:/CannabisPOS/server/prisma/seed.ts:47), [`server/prisma/schema.prisma:24`](F:/CannabisPOS/server/prisma/schema.prisma:24)
- **รายละเอียด:** seed สร้างบัญชี privileged ด้วยรหัสผ่านคงที่ และ schema มี password hash default
- **ผลกระทบ:** หาก environment ใช้ seed/default ดังกล่าว ผู้โจมตีสามารถ login ด้วย credential ที่เผยแพร่ใน source
- **แนวทางแก้:** สร้างรหัสสุ่มครั้งเดียวจาก secret manager, บังคับเปลี่ยนรหัสผ่านเมื่อ login ครั้งแรก และลบ schema default

### SEC-008 — การเลือก tenant พึ่งพา shared Prisma client และ context ที่ไม่สม่ำเสมอ

- **ระดับ:** Medium
- **CWE:** CWE-639
- **ความเชื่อมั่น:** ปานกลาง
- **หลักฐาน:** [`server/src/services/TenantManager.ts:5-18`](F:/CannabisPOS/server/src/services/TenantManager.ts:5), [`server/src/routes/management.ts:12-15`](F:/CannabisPOS/server/src/routes/management.ts:12), [`server/src/lib/db.ts`](F:/CannabisPOS/server/src/lib/db.ts)
- **รายละเอียด:** `TenantManager` และ `getTenantPrisma` คืน shared Prisma client; การกรอง tenant ขึ้นกับ AsyncLocalStorage หรือการใส่ `tenantId` ในแต่ละ query
- **ผลกระทบ:** query ใดที่ลืมใส่ tenant filter หรือทำงานนอก request context อาจอ่าน/เขียนข้าม tenant
- **แนวทางแก้:** ใช้ tenant-bound client/context ที่บังคับใช้แบบ deny-by-default และเพิ่ม integration tests ตรวจ cross-tenant access

## ลำดับการแก้ไขที่แนะนำ

1. ปิดหรือป้องกัน `/api/management` ทันที และ rotate JWT/database credentials
2. แก้ JWT fallback และเพิ่ม startup validation
3. ปิด `/api/reset` และเพิ่ม authorization ให้ user/stock/settings/category mutations
4. ผูก Socket.IO กับ JWT และ tenant จาก token
5. ลบ hardcoded/default credentials และเพิ่มการสร้างบัญชีแบบปลอดภัย
6. เพิ่ม automated authorization และ tenant-isolation tests

## ข้อจำกัดของการตรวจ

- ไม่ได้รันแอปหรือทดสอบการโจมตีจริง
- ไม่ได้ตรวจ dependency internals และ generated `dist` เชิงลึก
- Codex Security Workbench ไม่สามารถสร้าง canonical scan report ได้ เนื่องจาก Windows code-page error ขณะอ่าน commit metadata; รายงานนี้เป็น source-backed static audit
- ควรตรวจสอบกับ deployment configuration ว่า credential ใน `.env.example` และ JWT fallback เคยถูกใช้งานจริงหรือไม่
