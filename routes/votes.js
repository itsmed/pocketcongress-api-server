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

    const filteredResponses = responses.map(resp => Object.assign({}, resp.data.results, {
      votes: resp.data.results.votes.filter(r => r.bill || r.nomination)
    }));


    filteredResponses.forEach(resp => {

      resp.votes.forEach(v => {
        seedDatabaseWithVoteData(v.congress, resp.chamber.toLowerCase(), v.session, v.roll_call);
        v.bill ? seedDatabaseWithBillData(v.congress, v.bill.number.toLowerCase().replace(/\W/g, '')) : '';
      });

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

function seedDatabaseWithVoteData(congress, chamber, session, rollCall) {
  const ref = db.ref(`votes/${congress}/${chamber}/${session}/${rollCall}`);
  axios.get(`https://api.propublica.org/congress/v1/${congress}/${chamber}/sessions/${session}/votes/${rollCall}.json`)
    .then(res => {
      if (res.data.status === 'ERROR') {
        return console.log('FUCKED', res.data.errors);
      }
      res.data.results.votes.vote.positions
        .forEach(p => {
          ref.push({ id: p.member_id, position: p.vote_position }, err => {
            if (err) {
              console.log('fuk', err.message);
            } else {
              console.log('saved junk');
            }
          });
        });
    })
    .catch(err => console.log('why erroring?', err.message));
}


function seedDatabaseWithRepData(id) {
  const ref = db.ref(`federalReps/${id}`);

  ref.once('value', function(snap) {
    if (snap.val() === null) {
      return axios.get(`https://api.propublica.org/congress/v1/members/${id}.json`)
        .then(res => {
          if (!res.data.results) {
            return console.log('error', res.data.error);
          }
          ref.set(res.data.results[0], function(err) {
            if (err) {
              return Promise.reject(err);
            }
            console.log('success');
          });
        })
        .catch(err => console.log("no luck", err.message));
    } else {
      return console.log('already in database', snap.val());
    }

  });
}


function seedDatabaseWithBillData(congress, billId) {
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
