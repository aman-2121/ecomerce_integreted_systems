import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface UserPaymentMethodAttributes {
  id: number;
  userId: number;
  type: 'card' | 'bank' | 'mobile';
  provider: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  chapaToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserPaymentMethodCreationAttributes extends Optional<UserPaymentMethodAttributes, 'id' | 'isDefault' | 'createdAt' | 'updatedAt'> {}

class UserPaymentMethod extends Model<UserPaymentMethodAttributes, UserPaymentMethodCreationAttributes> implements UserPaymentMethodAttributes {
  public id!: number;
  public userId!: number;
  public type!: 'card' | 'bank' | 'mobile';
  public provider!: string;
  public last4?: string;
  public brand?: string;
  public expiryMonth?: number;
  public expiryYear?: number;
  public isDefault!: boolean;
  public chapaToken?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserPaymentMethod.init(
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
    type: {
      type: DataTypes.ENUM('card', 'bank', 'mobile'),
      allowNull: false,
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'chapa',
    },
    last4: {
      type: DataTypes.STRING(4),
      allowNull: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    expiryMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    expiryYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    chapaToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'user_payment_methods',
    timestamps: true,
  }
);

export default UserPaymentMethod;
