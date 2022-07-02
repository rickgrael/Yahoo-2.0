const db = require('../db');

const Answer = db.define('answer', {
    description: {
        type: db.Sequelize.STRING,
        allowNull: false
    },
    votes:{
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    questionId:{
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    userId:{
        type: db.Sequelize.INTEGER
    }
})

db.sync({force:false});

module.exports = Answer;