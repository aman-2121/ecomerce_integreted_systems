'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change image column from BYTEA to STRING
    await queryInterface.changeColumn('products', 'image', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Change back to BYTEA
    await queryInterface.changeColumn('products', 'image', {
      type: 'BYTEA',
      allowNull: true,
    });
  }
};
