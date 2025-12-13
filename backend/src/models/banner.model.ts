import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface BannerAttributes {
  id: number;
  title: string;
  description?: string;
  image: string;
  link?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BannerCreationAttributes extends Optional<BannerAttributes, 'id' | 'description' | 'link' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Banner extends Model<BannerAttributes, BannerCreationAttributes> implements BannerAttributes {
  public id!: number;
  public title!: string;
  public description?: string;
  public image!: string;
  public link?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Banner.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'banners',
    timestamps: true,
  }
);

export default Banner;
