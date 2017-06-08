require('dotenv').config();
const axios = require('axios');

axios.defaults.headers['X-API-KEY'] = process.env.PROPUBLICA_API_KEY;

exports.getVotesByDate = function(req, res) {
  const { month, year } = req.body.data;

  const house = axios.get(`https://api.propublica.org/congress/v1/house/votes/${year}/${month}.json`);
  const senate = axios.get(`https://api.propublica.org/congress/v1/senate/votes/${year}/${month}.json`);

  Promise.all([house, senate])
  .then(responses => {
    const allData = {};

    responses.forEach(resp => {
      allData[resp.data.results.chamber] = resp.data.results;
    });

    res.json({ data: allData }); 
  })
  .catch(err => res.json({ error: err.message }));
};
