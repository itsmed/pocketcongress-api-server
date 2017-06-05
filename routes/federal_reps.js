require('dotenv').config();
const axios = require('axios');

axios.defaults.headers['X-API-KEY'] = process.env.PROPUBLICA_API_KEY;

exports.getFederalRepsByDistrict = (req, res) => {
  console.log('fjs', req.body);
  const { state, district } = req.body.data;

  const house = axios.get(`https://api.propublica.org/congress/v1/members/house/${state}/${district}/current.json`);
  const senate = axios.get(`https://api.propublica.org/congress/v1/members/senate/${state}/current.json`);
  const allReps = {};

  Promise.all([house, senate])
    .then(responses => {
      responses.forEach(resp => {
        const { results } = resp.data;

        for (let i = 0; i < results.length; i++) {
          allReps[results[i]['id']] = results[i];
        }
      });
      return allReps;
    })
    .then((reps => res.json({ reps: reps })))
    .catch(err => res.json({ error: err.message }));

};
