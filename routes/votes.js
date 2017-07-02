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
    const proms = [];

    responses.forEach(resp => {
      const newVotes = [];
      const votes = resp.data.results.votes;

      for(let i = 0; i < votes.length; i++) {
        const vote = votes[i];

        if(vote.bill) {
          proms.push(axios.get(vote.bill.api_uri));
        } else if(vote.nomination) {
          proms.push(axios.get(`https://api.propublica.org/congress/v1/115/nominees/${vote.nomination.number}.json`));
        } else {
          console.log('[IGNORING ITEM]', vote);
          continue;
        }
      }

      Promise.all(proms)
        .then(voteResps => {
          voteResps.forEach(voteResp => {
            newVotes.push(voteResp.data.results[0]);
          });
          return newVotes;
        })
        .then(voteArray => {
          delete resp.data.results.votes;
          resp.data.results.votes = voteArray;

          allData[resp.data.results.chamber] = resp.data.results;
          
          return allData;    
        })
        .then(data => res.json(data))
        .catch(err => console.log('oh no', err.message));      
    });
  })
  .catch(err => res.json({ error: err.message }));          
};
