import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../../modules/iam/entities/user.entity';
import { RoleEntity } from '../../modules/iam/entities/role.entity';
import { PermissionEntity } from '../../modules/iam/entities/permission.entity';
import { UserRoleEntity } from '../../modules/iam/entities/user-role.entity';

export async function runInitialSeed(dataSource: DataSource) {
  const permRepo = dataSource.getRepository(PermissionEntity);
  const roleRepo = dataSource.getRepository(RoleEntity);
  const userRepo = dataSource.getRepository(UserEntity);
  const userRoleRepo = dataSource.getRepository(UserRoleEntity);

  console.log('🌱 Bắt đầu khởi tạo dữ liệu mẫu (Seeding)...');

  // 1. Core Permissions
  const permissionsData = [
    { module: 'CORE-DASH', action: 'read', code: 'dashboard.read', description: 'Xem tổng quan Dashboard' },
    { module: 'CORE-ORG', action: 'manage', code: 'organization.manage', description: 'Quản trị Doanh nghiệp' },
    { module: 'PARK-SITE', action: 'manage', code: 'site.manage', description: 'Quản lý Bãi đỗ xe' },
    { module: 'PARK-LANE', action: 'control', code: 'lane.control', description: 'Điều khiển làn xe' },
    { module: 'PARK-LANE', action: 'barrier_open', code: 'barrier.open', description: 'Mở cần barrier' },
    { module: 'PARK-SESSION', action: 'read', code: 'session.read', description: 'Xem lượt gửi xe' },
    { module: 'PARK-SESSION', action: 'create', code: 'session.create', description: 'Tạo lượt vào/ra' },
    { module: 'PARK-SESSION', action: 'override', code: 'session.override', description: 'Sửa biển số / Mở thủ công' },
    { module: 'BILLING', action: 'collect', code: 'payment.collect', description: 'Thu phí gửi xe' },
    { module: 'BILLING', action: 'refund', code: 'payment.refund', description: 'Hoàn tiền gửi xe' },
    { module: 'AI-ANPR', action: 'configure', code: 'ai.anpr.configure', description: 'Cấu hình AI ANPR' },
    { module: 'IAM', action: 'manage', code: 'iam.manage', description: 'Quản lý người dùng và quyền' },
  ];

  const savedPerms: PermissionEntity[] = [];
  for (const p of permissionsData) {
    let perm = await permRepo.findOne({ where: { code: p.code } });
    if (!perm) {
      perm = permRepo.create(p);
      perm = await permRepo.save(perm);
    }
    savedPerms.push(perm);
  }

  // 2. System Roles
  const rolesData = [
    { code: 'SUPER_ADMIN', name: 'Quản trị viên Nền tảng Toàn cầu', description: 'Toàn quyền trên toàn bộ nền tảng SPM', is_system: true },
    { code: 'ORG_ADMIN', name: 'Quản trị viên Doanh nghiệp', description: 'Toàn quyền trong phạm vi Doanh nghiệp thuê bao', is_system: true },
    { code: 'PARKING_MANAGER', name: 'Quản lý Bãi xe', description: 'Quản lý vận hành bãi đỗ xe được chỉ định', is_system: true },
    { code: 'PARKING_STAFF', name: 'Nhân viên Bốt Cabin', description: 'Vận hành làn xe, kiểm soát và thu phí trực tiếp', is_system: true },
    { code: 'CUSTOMER', name: 'Khách hàng / Chủ xe', description: 'Chủ phương tiện sử dụng ứng dụng di động', is_system: true },
  ];

  const savedRoles: Record<string, RoleEntity> = {};
  for (const r of rolesData) {
    let role = await roleRepo.findOne({ where: { code: r.code } });
    if (!role) {
      role = roleRepo.create({ ...r, permissions: savedPerms });
      role = await roleRepo.save(role);
    }
    savedRoles[r.code] = role;
  }

  // 3. Super Admin User
  const adminEmail = process.env.INITIAL_SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.INITIAL_SUPER_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.log('ℹ️ Seed Super Admin bị bỏ qua: cấu hình INITIAL_SUPER_ADMIN_EMAIL/PASSWORD');
  } else {
  let superAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!superAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    superAdmin = userRepo.create({
      email: adminEmail,
      phone_number: '0900000001',
      full_name: 'SPM Super Administrator',
      password_hash: passwordHash,
      user_type: 'SUPER_ADMIN',
      is_active: true,
    });
    superAdmin = await userRepo.save(superAdmin);

    // Assign Super Admin Role
    const userRole = userRoleRepo.create({
      user_id: superAdmin.id,
      role_id: savedRoles['SUPER_ADMIN'].id,
    });
    await userRoleRepo.save(userRole);

    console.log(`✅ Đã khởi tạo Super Admin một lần: ${adminEmail}`);
  }
  }

  console.log('🎉 Hoàn thành khởi tạo dữ liệu mẫu thành công!');
}
