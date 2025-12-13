import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class EmailTemplate extends Model {
  public id!: number;
  public name!: string;
  public subject!: string;
  public body!: string;
  public variables!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

EmailTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'EmailTemplate',
    tableName: 'email_templates',
    timestamps: true,
  }
);

export default EmailTemplate;
