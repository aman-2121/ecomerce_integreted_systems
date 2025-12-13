import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SystemSettingsAttributes {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  isPublic: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SystemSettingsCreationAttributes extends Optional<SystemSettingsAttributes, 'id' | 'description' | 'createdAt' | 'updatedAt'> {}

class SystemSettings extends Model<SystemSettingsAttributes, SystemSettingsCreationAttributes> implements SystemSettingsAttributes {
  public id!: number;
  public key!: string;
  public value!: string;
  public description?: string;
  public category!: string;
  public isPublic!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SystemSettings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'system_settings',
    timestamps: true,
  }
);

export default SystemSettings;
