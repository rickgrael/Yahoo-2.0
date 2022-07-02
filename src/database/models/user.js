const db = require('../db');

const User = db.define('user', {
    name: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
    password: {
        type: db.Sequelize.STRING,
        allowNull: false,
    },
});

db.sync({force:false})

module.exports = User;