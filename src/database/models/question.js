const db = require('../db');

const Question = db.define('question', {
    title: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    description: {
        type: db.Sequelize.STRING,
        allowNull: true
    },
    votes: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    userId: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    }
})

db.sync({force:false})

module.exports = Question;