'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('products');
    if (!tableInfo.categoryId) {
      await queryInterface.addColumn('products', 'categoryId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('products');
    if (tableInfo.categoryId) {
      await queryInterface.removeColumn('products', 'categoryId');
    }
  }
};
