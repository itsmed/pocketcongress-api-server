const location = require('./location');
const federalReps = require('./federal_reps');


module.exports = function(app) {
  app.post('/api/district-by-address', location.getDistrictInfoByAddress);

  app.post('/api/get-district-by-coords', location.getDistrictInfoByCoords);

  app.post('/api/reps/all/federal/by-district', federalReps.getFederalRepsByDistrict);





  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            background-color: gray;
            font-family: sans-serif;
          }
        </style>
      </head>
      <body>
        <h1>Hello world!</h1>
      </body>
      </html>
    `);
  });

};