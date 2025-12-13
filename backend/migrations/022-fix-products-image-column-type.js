'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if the column exists and what type it is
    const tableDescription = await queryInterface.describeTable('products');

    if (tableDescription.image) {
      // Drop the existing image column if it exists
      await queryInterface.removeColumn('products', 'image');
    }

    // Add the image column as BYTEA
    await queryInterface.addColumn('products', 'image', {
      type: 'BYTEA',
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
