const location = require('./location');
const federalReps = require('./federal_reps');
const votes = require('./votes');


module.exports = function(app) {
  app.post('/api/get-district-by-address', location.getDistrictInfoByAddress);

  app.post('/api/get-district-by-coords', location.getDistrictInfoByCoords);

  app.post('/api/reps/all/federal/by-district', federalReps.getFederalRepsByDistrict);

  app.get('/api/votes/date/:month/:year', votes.getVotesByDate);
  app.get('/api/votes/specific-bill/:congress/:id', votes.getSpecificBill);

};