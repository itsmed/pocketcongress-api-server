require('dotenv').config();
const axios = require("axios");

exports.getDistrictInfoByAddress = (req, res) => {
  const { street, apt, city, state } = req.body.data;
  let s, streetAddress;

  try {
    s = street.split(' ').join('+');
    streetAddress = apt ? s.concat('+Apt+', apt) : street;
  } catch (e) {
    Promise.reject(e);
  }
  console.log('got here!', streetAddress, city, state);

  axios.get(`https://api.geocod.io/v1/geocode?street=${streetAddress}&city=${city}&state=${state}&fields=cd,stateleg&api_key=${process.env.GEOCODIO_API_KEY}`)
    .then(r => res.json({
      results: mapGeocodioResults(r.data.results)
    }))
    .catch(err => {
      res.status(200).json({ error: 'All fields required' });
    });
};

exports.getDistrictInfoByCoords = (req, res) => {
  console.log(req.body);
  let { lat, long } = req.body.data;

  axios.get(`https://api.geocod.io/v1/reverse?q=${lat},${long}&fields=cd,stateleg&api_key=${process.env.GEOCODIO_API_KEY}`)
    .then(r => {
      res.json({ results: mapGeocodioResults(r.data.results) });
    })
    .catch(e => {
      res.status(200).json({ error: 'An error occured, please try again' });
    });
};

function mapGeocodioResults(xs) {
  return xs.map(addrObj => {
    return {
      address_components: addrObj.address_components,
      location: addrObj.location,
      fields: addrObj.fields
    };
  });
}
