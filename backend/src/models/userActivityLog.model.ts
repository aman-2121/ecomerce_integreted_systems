import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserActivityLogAttributes {
  id: number;
  userId: number;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserActivityLogCreationAttributes extends Optional<UserActivityLogAttributes, 'id' | 'details' | 'ipAddress' | 'userAgent' | 'createdAt' | 'updatedAt'> {}

class UserActivityLog extends Model<UserActivityLogAttributes, UserActivityLogCreationAttributes> implements UserActivityLogAttributes {
  public id!: number;
  public userId!: number;
  public action!: string;
  public details?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserActivityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'user_activity_logs',
    timestamps: true,
  }
);

export default UserActivityLog;
