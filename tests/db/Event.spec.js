const expect = require('chai').expect;
const { Event, User, Assigned } = require('../../db/models');
const faker = require('faker');

describe('Event database model', () => {
  it('can create an event with status of upcoming', done => {
    const date = new Date();
    Event.create({
      title: 'title',
      category: 'chore',
      deadline: date,
    })
      .then(event => {
        expect(event.title).to.equal('title');
        expect(event.status).to.equal('upcoming');
        expect(event.deadline.getDate()).to.equal(date.getDate());
        expect(event.deadline.getMonth()).to.equal(date.getMonth());
        done();
      })
      .catch(ex => done(ex));
  });
  it('will not allow an event with an invalid status', done => {
    Event.create({
      title: 'title',
      category: 'not a cat',
    })
      .then(() => {
        const e = new Error('oops, an event was created with invalid category');
        done(e);
      })
      .catch(() => done());
  });
  it('can create an event with a user as the owner', async () => {
    const date = new Date('2019-12-17T18:15:00');
    const user = await User.create({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      isAdmin: true,
      birthday: new Date('1/1/1996'),
      email: faker.internet.email(),
      imgUrl:
        'https://m.media-amazon.com/images/M/MV5BODAyMGNkNWItYmFjZC00MTA5LTg3ZGItZWQ0MTIxNTg2N2JmXkEyXkFqcGdeQXVyNDQzMDg4Nzk@._V1_.jpg',
      password: 'P@ssword1',
    });
    Event.create({
      title: 'title',
      category: 'event',
      ownerId: user.id,
      deadline: date,
    })
      .then(event => {
        expect(event.ownerId).to.equal(user.id);
        expect(event.deadline.getYear()).to.equal(date.getYear());
      })
      .catch(e => {
        throw new Error(e);
      });
  });
  it('can assign an event to another user', async () => {
    const user = await User.create({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      isAdmin: true,
      birthday: new Date('1/1/1996'),
      email: faker.internet.email(),
      imgUrl:
        'https://m.media-amazon.com/images/M/MV5BODAyMGNkNWItYmFjZC00MTA5LTg3ZGItZWQ0MTIxNTg2N2JmXkEyXkFqcGdeQXVyNDQzMDg4Nzk@._V1_.jpg',
      password: 'P@ssword1',
    });
    const assignee = await User.create({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      isAdmin: true,
      birthday: new Date('1/1/1996'),
      email: faker.internet.email(),
      imgUrl:
        'https://m.media-amazon.com/images/M/MV5BODAyMGNkNWItYmFjZC00MTA5LTg3ZGItZWQ0MTIxNTg2N2JmXkEyXkFqcGdeQXVyNDQzMDg4Nzk@._V1_.jpg',
      password: 'P@ssword1',
    });
    const event = await Event.create({
      title: 'sometitle',
      category: 'appointment',
      ownerId: user.id,
    });
    Assigned.invite({
      eventId: event.id,
      userId: assignee.id,
    })
      .then(assigned => {
        expect(assigned.eventId).to.equal(event.id);
        expect(assigned.userId).to.equal(assignee.id);
      })
      .catch(e => {
        throw new Error(e);
      });
  });
  it('has a method to find all events assigned to a particular user', async () => {
    const user = await User.create({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      isAdmin: true,
      birthday: new Date('1/1/1996'),
      email: faker.internet.email(),
      imgUrl:
        'https://m.media-amazon.com/images/M/MV5BODAyMGNkNWItYmFjZC00MTA5LTg3ZGItZWQ0MTIxNTg2N2JmXkEyXkFqcGdeQXVyNDQzMDg4Nzk@._V1_.jpg',
      password: 'P@ssword1',
    });
    const event = await Event.create({
      title: 'event title',
      category: 'chore',
    });
    const assigned = await Assigned.invite({
      eventId: event.id,
      userId: user.id,
    });
    Event.findAssigned(user.id)
      .then(events => {
        expect(events.length).to.equal(1);
        expect(events[0].title).to.equal('event title');
        expect(events[0].category).to.equal('chore');
      })
      .catch(e => {
        throw new Error(e);
      });
  });
  it('can find assignees to a particular event', async () => {
    const user = await User.findOne();
    const newEv = await Event.create({
      title: 'a test event',
      category: 'chore',
    });
    await Assigned.invite({
      userId: user.id,
      eventId: newEv.id,
    });
    newEv
      .findAssignees()
      .then(assignees => {
        expect(assignees.length).to.equal(1);
        expect(assignees[0].id).to.equal(user.id);
      })
      .catch(e => {
        throw new Error(e);
      });
  });
});
