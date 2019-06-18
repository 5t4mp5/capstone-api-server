'use strict';

const chai = require('chai');
const expect = chai.expect;
const app = require('../../server').app;
const agent = require('supertest')(app);
const { User, Family } = require('../../db');
const faker = require('faker');
const jwt = require('jwt-simple');
const image = require('./image');

describe('User Routes', () => {
  let userMap;
  const userData = [
    {
      firstName: 'Bob',
      lastName: 'Smith',
      birthday: new Date('1/1/1990'),
      imgUrl: image,
      password: 'P@ssword1',
    },
    {
      firstName: 'Jane',
      lastName: 'Doe',
      birthday: new Date('1/1/1990'),
      imgUrl:
        'https://m.media-amazon.com/images/M/MV5BODAyMGNkNWItYmFjZC00MTA5LTg3ZGItZWQ0MTIxNTg2N2JmXkEyXkFqcGdeQXVyNDQzMDg4Nzk@._V1_.jpg',
      password: 'P@ssword1',
    },
  ];

  beforeEach(async () => {
    userData[0].email = faker.internet.email();
    userData[1].email = faker.internet.email();
    userMap = await Promise.all(userData.map(user => User.create(user)));
  });
  describe('PUT /api/users/login', () => {
    it('can log a user in', async () => {
      const response = await agent.put(`/api/users/login`).send({
        email: userMap[0].email,
        password: 'P@ssword1',
      });
      expect(response.text).to.equal(
        jwt.encode(userMap[0].id, process.env.SECRET)
      );
    });
  });
  describe('GET /api/users/authed', () => {
    it('can get a user based on a token.', async () => {
      const response = await agent.put(`/api/users/login`).send({
        email: userMap[0].email,
        password: 'P@ssword1',
      });
      const userResponse = await agent
        .get('/api/users/authed')
        .set({ authorization: response.text });
      expect(userResponse.body.id).to.equal(userMap[0].id);
    });
  });
  describe('POST /api/users', () => {
    it('can create a user and return the token for that user', async () => {
      const newUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        birthday: new Date('1/1/1990'),
        imgUrl: 'http://www.gstatic.com/tv/thumb/persons/49256/49256_v9_ba.jpg',
        password: 'P@ssword1',
      };
      const response = await agent.post('/api/users').send(newUser);
      const token = response.text;
      const created = await agent
        .get('/api/users/authed')
        .set({ authorization: token });
      expect(created.body.email.toLowerCase()).to.equal(
        newUser.email.toLowerCase()
      );
    });
    it('can assign a family id to the new user if code is entered', async () => {
      const newUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        birthday: new Date('1/1/1990'),
        imgUrl: 'http://www.gstatic.com/tv/thumb/persons/49256/49256_v9_ba.jpg',
        password: 'P@ssword1',
      };
      const family = await Family.create({
        name: newUser.lastName,
        code: faker.random.uuid(),
      });
      newUser.familyCode = family.code;
      const response = await agent.post('/api/users').send(newUser);
      const token = response.text;
      const created = await agent
        .get('/api/users/authed')
        .set({ authorization: token });
      expect(created.body.familyId).to.equal(family.id);
    });
    it('can create and assign a new family to a new user', async () => {
      const newUser = {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        birthday: new Date('1/1/1990'),
        imgUrl: 'http://www.gstatic.com/tv/thumb/persons/49256/49256_v9_ba.jpg',
        password: 'P@ssword1',
      };
      newUser.family = { name: newUser.lastName, code: faker.random.uuid() };
      const response = await agent.post('/api/users').send(newUser);
      const token = response.text;
      const created = await agent
        .get('/api/users/authed')
        .set({ authorization: token });
      expect(created.body.familyId).to.be.ok;
    });
  });
  describe('GET /relationships', () => {
    it('can get all relationships for the logged in user', async () => {
      const token = await User.authenticate('janedoe@email.com', 'p@ssWord!2');
      const response = await agent
        .get('/api/users/relationships')
        .set({ authorization: token });
      const relationships = response.body;
      expect(relationships.length).to.equal(3);
    });
  });
});
