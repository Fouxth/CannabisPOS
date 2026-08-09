# รายงานตรวจสอบความปลอดภัยรอบสอง

**โครงการ:** CannabisPOS  
**วันที่ตรวจ:** 9 สิงหาคม 2026  
**ขอบเขต:** working-tree diff เทียบกับ `HEAD` โดยเน้น auth/authz, JWT, tenant isolation, Socket.IO และ credential handling

## สรุปผล

การแก้ไขปิดช่องโหว่เดิมได้หลายรายการ ได้แก่ management API ถูกย้ายหลัง authentication และบังคับ `SUPER_ADMIN`, reset endpoint มี permission, user management มี role/ownership checks, seed ไม่มีรหัสผ่านคงที่, และ Socket.IO ตรวจ token/tenant room แล้ว

อย่างไรก็ตาม ยังพบช่องโหว่/ความเสี่ยงที่ควรแก้ 3 รายการ และมีข้อสังเกตด้านความปลอดภัยอีก 1 รายการ

## รายการที่ยังต้องแก้

### RECHECK-001 — JWT placeholder ในตัวอย่าง configuration ยังถูกยอมรับเป็น secret จริง

- **ระดับ:** High
- **CWE:** CWE-321, CWE-798
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/.env.example:5`](F:/CannabisPOS/server/.env.example:5), [`server/src/middleware/auth.ts:4-15`](F:/CannabisPOS/server/src/middleware/auth.ts:4)
- **รายละเอียด:** `.env.example` กำหนด `JWT_SECRET="change-this-to-a-secure-random-secret-key"` แต่ `getJwtSecret()` ปฏิเสธเฉพาะค่าเก่า `your-secret-key-change-in-production` เท่านั้น
- **ผลกระทบ:** deployment ที่คัดลอก `.env.example` โดยไม่เปลี่ยนค่า จะใช้ secret ที่ผู้โจมตีรู้ล่วงหน้าและปลอม JWT ได้
- **แนวทางแก้:** ปฏิเสธ placeholder ทุกค่า รวมถึงค่านี้ และใช้ allowlist/ตรวจ entropy; ให้ `.env.example` ใช้ค่า placeholder ที่ระบบ reject แน่นอน

### RECHECK-002 — Seed พิมพ์รหัสผ่าน plaintext ลง log และใช้ `Math.random()` สร้างรหัสผ่าน

- **ระดับ:** Medium
- **CWE:** CWE-532, CWE-338
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/prisma/seed.ts:46-47`](F:/CannabisPOS/server/prisma/seed.ts:46), [`server/prisma/seed.ts:61`](F:/CannabisPOS/server/prisma/seed.ts:61), [`server/prisma/seed.ts:76`](F:/CannabisPOS/server/prisma/seed.ts:76)
- **รายละเอียด:** เมื่อไม่มี env password ระบบใช้ `Math.random()` และพิมพ์รหัสผ่านที่สร้างลง stdout
- **ผลกระทบ:** log aggregation/CI output อาจกลายเป็นช่องทางขโมย credential; `Math.random()` ไม่ใช่ CSPRNG
- **แนวทางแก้:** ใช้ `crypto.randomBytes()` หรือรับ secret จาก secret manager เท่านั้น, ห้ามพิมพ์ password, และส่งรหัสผ่านผ่านช่องทาง bootstrap ที่ควบคุมได้

### RECHECK-003 — Socket.IO ไม่ตรวจว่า tenant ยัง active อยู่

- **ระดับ:** Medium
- **CWE:** CWE-613, CWE-284
- **ความเชื่อมั่น:** สูง
- **หลักฐาน:** [`server/src/services/SocketService.ts:31-55`](F:/CannabisPOS/server/src/services/SocketService.ts:31), เปรียบเทียบกับ tenant-active check ใน [`server/src/middleware/auth.ts:61-71`](F:/CannabisPOS/server/src/middleware/auth.ts:61)
- **รายละเอียด:** Socket handshake ตรวจเพียงลายเซ็นและอายุ JWT แต่ไม่ตรวจ `tenant.isActive`; token ของ tenant ที่ถูกระงับยังเชื่อมต่อและเข้าห้องได้
- **ผลกระทบ:** ผู้ใช้ของร้านที่ถูกปิดยังรับข้อมูล realtime ต่อจนกว่า token หมดอายุ
- **แนวทางแก้:** ตรวจ tenant status ใน Socket.IO middleware, disconnect เมื่อ tenant ถูกปิด และพิจารณา token revocation/versioning

## ข้อสังเกตเพิ่มเติม

- `createTenantScopedPrisma()` บังคับ `tenantId` ใน `where` ได้ดีขึ้น แต่ฝั่ง write ยังใช้ `data.tenantId ?? tenantId`; ควร override เป็น tenant ที่ผูกไว้เสมอ (`tenantId` ต้องชนะค่าจาก input) เพื่อป้องกัน future caller ที่ส่ง tenantId ข้ามร้าน
- `npm run build` ใน `server` ผ่าน
- `npm run lint` ยังไม่ผ่านจากปัญหาเดิม/ที่มีอยู่จำนวนมากใน generated files และ frontend (รวม 396 errors, 12 warnings); ไม่พบหลักฐานว่าปัญหาเหล่านี้เป็นช่องโหว่จากแพตช์โดยตรง

## สถานะช่องโหว่เดิม

| รายการเดิม | สถานะ |
|---|---|
| Management API ไม่ auth | แก้แล้วจาก source ที่ตรวจ |
| JWT fallback เดาง่าย | แก้ fallback เดิมแล้ว แต่ยังมี placeholder ใหม่ที่ต้อง reject |
| DB credential ใน `.env.example` | แก้เป็น localhost/placeholder แล้ว แต่ควรตรวจ Git history และ rotate credential เดิม |
| Socket room join ข้าม tenant | แก้การ join room แล้ว แต่ยังขาด active-tenant check |
| `/api/reset` ไม่มี permission | แก้แล้ว โดยใช้ `MANAGE_BACKUP` และ audit log |
| User IDOR/privilege escalation | แก้หลัก ๆ แล้วจาก route guards และ tenant checks |
| Hardcoded seed credentials | แก้ค่า password คงที่แล้ว แต่เกิด log/password-generation risk ใหม่ |

## ลำดับแก้ไขแนะนำ

1. Reject JWT placeholders และตรวจ secret entropy
2. หยุดพิมพ์ password ลง log และเปลี่ยนเป็น CSPRNG
3. เพิ่ม active-tenant/revocation check ใน Socket.IO
4. เปลี่ยน `data.tenantId ?? tenantId` เป็นการบังคับใช้ tenant ที่ผูกไว้
5. Rotate credential ที่เคยอยู่ใน Git history
