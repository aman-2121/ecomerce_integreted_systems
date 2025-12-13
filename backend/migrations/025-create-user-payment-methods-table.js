'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_payment_methods', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      type: {
        type: Sequelize.ENUM('card', 'bank', 'mobile'),
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'chapa',
      },
      last4: {
        type: Sequelize.STRING(4),
        allowNull: true,
      },
      brand: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      expiryMonth: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      expiryYear: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      // For Chapa, we might store tokenized data
      chapaToken: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add index on userId for faster queries
    await queryInterface.addIndex('user_payment_methods', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_payment_methods');
  },
};
