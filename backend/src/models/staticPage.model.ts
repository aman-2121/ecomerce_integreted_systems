import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StaticPageAttributes {
  id: number;
  slug: string;
  title: string;
  content: string;
  isPublished: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StaticPageCreationAttributes extends Optional<StaticPageAttributes, 'id' | 'metaTitle' | 'metaDescription' | 'createdAt' | 'updatedAt'> {}

class StaticPage extends Model<StaticPageAttributes, StaticPageCreationAttributes> implements StaticPageAttributes {
  public id!: number;
  public slug!: string;
  public title!: string;
  public content!: string;
  public isPublished!: boolean;
  public metaTitle?: string;
  public metaDescription?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StaticPage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    metaTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metaDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'static_pages',
    timestamps: true,
  }
);

export default StaticPage;
