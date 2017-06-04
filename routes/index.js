const location = require('./location');


module.exports = function(app) {
  app.post('/api/location-by-address', location.getLocationInfoByAddress);

  app.post('/api/get-location-by-coords', location.getLocationInfoByCoords);
};