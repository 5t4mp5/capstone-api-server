const router = require('express').Router();
const { User, Relationship, Poll } = require('../db/models');

//auth routes
router.put('/login', (req, res, next) => {
  User.authenticate(req.body.email, req.body.password)
    .then(token => res.send(token))
    .catch(next);
});

//get user by token
router.get('/authed', (req, res, next) => {
  if (req.user) {
    res.send(req.user);
  } else {
    const err = new Error('Not logged in');
    err.status = 401;
    next(err);
  }
});

//create new user
router.post('/', (req, res, next) => {
  User.signUp(req.body)
    .then(token => res.send(token))
    .catch(next);
});

//get users relationships
router.get('/relationships', (req, res, next) => {
  Relationship.findAll({
    where: {
      userId: req.user.id,
    },
  })
    .then(relationships => res.send(relationships))
    .catch(next);
});

//get relationships to a user
router.get('/:id/relatives/relationships', (req, res, next) => {
  Relationship.findAll({
    where: {
      RelationshipId: req.params.id,
    },
  })
    .then(relationships => res.send(relationships))
    .catch(next);
});

//update relationship status
router.put('/:id/relationships/status', (req, res, next) => {
  const { RelationshipId, diff } = req.body;
  Relationship.updateStatus(req.params.id, RelationshipId, diff)
    .then(relationship => res.status(201).send(relationship))
    .catch(next);
});

//update relationship type
router.put('/:id/relationships/type', (req, res, next) => {
  Relationship.findOne({
    where: { userId: req.params.id, RelationshipId: req.body.RelationshipId },
  })
    .then(relationship => relationship.update({ type: req.body.type }))
    .then(updated => res.status(201).send(updated))
    .catch(next);
});

//create new relationship
router.post('/:id/relationships', (req, res, next) => {
  Relationship.create({
    userId: req.params.id,
    RelationshipId: req.body.RelationshipId,
    type: req.body.type,
  })
    .then(newRelationship => res.status(201).send(newRelationship))
    .catch(next);
});

//delete relationship
router.delete('/:id/relationships', (req, res, next) => {
  Relationship.findOne({
    where: { userId: req.params.id, RelationshipId: req.body.RelationshipId },
  })
    .then(relationship => relationship.destroy)
    .then(() => res.sendStatus(200))
    .catch(next);
});

//get users polls
router.get('/:id/polls', (req, res, next) => {
  Poll.findAll({
    where: {
      ownerId: req.params.id,
    },
  })
    .then(polls => res.send(polls))
    .catch(next);
});

module.exports = router;
