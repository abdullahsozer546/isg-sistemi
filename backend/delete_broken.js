const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'database.sqlite', logging: false });
sequelize.query(\"DELETE FROM Trainings WHERE content LIKE '%Sistem geçici%'\").then(() => console.log('OK')).catch(console.error);
