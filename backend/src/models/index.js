const User = require('./User');
const Task = require('./Task');

// Associations
User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { User, Task };
