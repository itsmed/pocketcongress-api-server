const location = require('./location');
const federalReps = require('./federal_reps');


module.exports = function(app) {
  app.post('/api/location-by-address', location.getLocationInfoByAddress);

  app.post('/api/get-location-by-coords', location.getLocationInfoByCoords);

  app.post('/api/reps/all/federal/by-district', federalReps.getFederalRepsByDistrict);

};