'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column exists first
    const tableInfo = await queryInterface.describeTable('order_items');
    
    if (tableInfo.unitPrice) {
      // Rename unitPrice to price
      await queryInterface.renameColumn('order_items', 'unitPrice', 'price');
    } else if (tableInfo.price) {
      console.log('Column "price" already exists');
    } else {
      // Neither column exists, add price column
      await queryInterface.addColumn('order_items', 'price', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('order_items');
    
    if (tableInfo.price) {
      await queryInterface.renameColumn('order_items', 'price', 'unitPrice');
    } else if (tableInfo.unitPrice) {
      console.log('Column "unitPrice" already exists');
    }
  }
};