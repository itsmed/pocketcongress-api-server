require('dotenv').config();
const axios = require('axios');

const { db } = require('../firebase-init');

axios.defaults.headers['X-API-KEY'] = process.env.PROPUBLICA_API_KEY;

exports.getVotesByDate = function(req, res) {
  const { month, year } = req.body.data;

  const house = axios.get(`https://api.propublica.org/congress/v1/house/votes/${year}/${month}.json`);
  const senate = axios.get(`https://api.propublica.org/congress/v1/senate/votes/${year}/${month}.json`);

  Promise.all([house, senate])
  .then(responses => {
    const allData = {};

    console.log(responses[0].data.results);

    const filteredResponses = responses.map(resp => Object.assign({}, resp.data.results, {
      votes: resp.data.results.votes.filter(r => r.bill || r.nomination)
    }));


    filteredResponses.forEach(resp => {

      resp.votes.forEach(v => v.bill ? seedDatabase(v.congress, v.bill.number.toLowerCase().replace(/\W/g, '')) : '');

      allData[resp.chamber] = resp;
    });

    
    res.json(allData);
  })
  .catch(err => res.json({ error: err.message }));          
};


exports.getSpecificBill = function(req, res) {
  const { congress, billId } = req.body.data;
  
  const ref = db.ref(`bills/${congress}/${billId}`);

  ref.once('value', function(snap) {
    if (snap.val() === null) {

      const billDetailsPromise = axios.get(`https://api.propublica.org/congress/v1/${111}/bills/${billId}.json`);
      const billAmendmentsPromise = axios.get(`https://api.propublica.org/congress/v1/${congress}/bills/${billId}/amendments.json`);
      const billSubjectsPromise = axios.get(`https://api.propublica.org/congress/v1/${congress}/bills/${billId}/subjects.json`);

      let allData;

      Promise.all([billDetailsPromise, billAmendmentsPromise, billSubjectsPromise])
        .then((responses) => {
          allData = Object.assign({}, responses[0].data.results[0]);
          allData.amendments = responses[1].data.results[0].amendments;
          allData.subjects = responses[2].data.results[0].subjects;

          return allData;
        })
        .then(data => {
          ref.set(data, function(err) {
            if (err) {
              return console.log('[DATABASE ERROR]', err.message);
            }
          });
          return res.json(data);
        })
        .catch(err => console.log("hanlde errors better", err.message));
    } else {
      return res.json({ data: snap.val() });
    }
  });

};

function seedDatabase(congress, billId) {
  // console.log('seed database', congress, billId);
  const ref = db.ref(`bills/${congress}/${billId}`);

  ref.once('value', function(snap) {
    if (snap.val() === null) {

      const billDetailsPromise = axios.get(`https://api.propublica.org/congress/v1/${111}/bills/${billId}.json`);
      const billAmendmentsPromise = axios.get(`https://api.propublica.org/congress/v1/${congress}/bills/${billId}/amendments.json`);
      const billSubjectsPromise = axios.get(`https://api.propublica.org/congress/v1/${congress}/bills/${billId}/subjects.json`);

      let allData;

      Promise.all([billDetailsPromise, billAmendmentsPromise, billSubjectsPromise])
        .then((responses) => {
          allData = Object.assign({}, responses[0].data.results[0]);
          allData.amendments = responses[1].data.results[0].amendments;
          allData.subjects = responses[2].data.results[0].subjects;

          return allData;
        })
        .then(data => {
          ref.set(data, function(err) {
            if (err) {
              return console.log('[DATABASE ERROR]', err.message);
            }
          });
          return console.log('sucess');
        })
        .catch(err => console.log("hanlde errors better", err.message));
    } else {
      return console.log('already found');
    }
  });
}