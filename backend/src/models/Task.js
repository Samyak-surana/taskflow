const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [1, 200],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'done', 'archived'),
      defaultValue: 'todo',
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
  },
  {
    tableName: 'tasks',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['due_date'] },
    ],
  }
);

module.exports = Task;
