'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the existing image column
    await queryInterface.removeColumn('products', 'image');
    // Add the image column back as BYTEA
    await queryInterface.addColumn('products', 'image', {
      type: Sequelize.BLOB('long'),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the BYTEA column
    await queryInterface.removeColumn('products', 'image');
    // Add back as STRING
    await queryInterface.addColumn('products', 'image', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  }
};
