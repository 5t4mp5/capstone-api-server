const db = require('../db');
const { Sequelize } = db;
const Op = Sequelize.Op;
const Assigned = require('./Assigned');
const User = require('./User');

const Event = db.define('event', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
    },
    title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                args: true,
                msg: 'Event must have a title.'
            }
        }
    },
    deadline: {
        type: Sequelize.DATE
    },
    category: {
        type: Sequelize.ENUM('chore', 'errand', 'appointment', 'event'),
        allowNull: false,
    },
    status: {
        type: Sequelize.ENUM('upcoming', 'overdue', 'missed', 'completed-pending', 'completed'),
        defaultValue: 'upcoming'
    },
    description: {
        type: Sequelize.TEXT
    }
})
Event.findAssigned = function (userId) {
    return Assigned.findAll({
        where: {
            userId: userId
        },
        attributes: ['eventId']
    })
        .then(eventList => {
            return Event.findAll({
                where: {
                    id: {
                        [Op.in]: eventList.map(event => event.eventId)
                    }
                }
            })
        })
}
Event.prototype.findAssignees = function () {
    return Assigned.findAll({
        where: {
            eventId: this.id
        },
        attributes: ['userId']
    })
        .then(userList => {
            return User.findAll({
                where: {
                    id: {
                        [Op.in]: userList.map(user => user.userId)
                    }
                }
            })
        })
}

module.exports = Event;
