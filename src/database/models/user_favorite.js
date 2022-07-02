const db = require('../db');

const User_favorite = db.define('user_favorite', {
    userId: {
        type: db.Sequelize.INTEGER,
        allowNull: false,
    },
    questionId:{
        type: db.Sequelize.INTEGER,
        allowNull: false,
    }
})

db.sync({force:false});

module.exports = User_favorite;