// User Model
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role_id: { type: DataTypes.INTEGER, references: { model: 'Roles', key: 'id' } }
});

// Role Model
const Role = sequelize.define('Role', {
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true, allowNull: false }
});

// Permission Model
const Permission = sequelize.define('Permission', {
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, unique: true, allowNull: false }
});

// Định nghĩa mối quan hệ
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

// Quan hệ nhiều-nhiều giữa Role và Permission qua bảng trung gian
Role.belongsToMany(Permission, { through: 'RolePermissions', foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: 'RolePermissions', foreignKey: 'permission_id' });