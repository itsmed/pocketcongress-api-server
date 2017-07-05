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

        v.bill ? 
          seedDatabaseWithBillData(v.congress, v.bill.number.toLowerCase().replace(/\W/g, '')) 
        : 
          v.nomination ?
          seedDatabaseWithNomineeData(v.congress, v.nomination.number)
        : '';
      });

      allData[resp.chamber] = resp;
    });

    
    return allData;
  })
  .then(data => res.json(data))
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

  ref.once('value', function(snap) {
    if (snap.val() === null) {
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
    } else {
      return console.log(`${rollCall} Roll call vote for the ${session} of the ${congress} congress already found`);
    }
  });
}

function seedDatabaseWithNomineeData(congress, nomineeId) {
  const ref = db.ref(`nominees/${congress}/${nomineeId}`);

  ref.once('value', function(snap) {
    if (snap.val() === null) {

      return axios.get(`https://api.propublica.org/congress/v1/${congress}/nominees/${nomineeId}.json`)
        .then(res => ref.set(res.data.results[0]))
        .catch(err => console.log('errorr saving nominee data', err.message));
    } else {
      return console.log(nomineeId + ' nominee already found');
    }
  });


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
      return console.log(id + ' rep already in database');
    }

  });
}

function seedDatabaseWithBillData(congress, billId) {
  const ref = db.ref(`bills/${congress}/${billId}`);

  ref.once('value', function(snap) {
    if (snap.val() === null) {

      const billDetailsPromise = axios.get(`https://api.propublica.org/congress/v1/${congress}/bills/${billId}.json`);
      const billAmendmentsPromise = axios.get(`https://api.propublica.org/congress/v1/${congress}/bills/${billId}/amendments.json`);
      const billSubjectsPromise = axios.get(`https://api.propublica.org/congress/v1/${congress}/bills/${billId}/subjects.json`);

      let allData;

      return Promise.all([billDetailsPromise, billAmendmentsPromise, billSubjectsPromise])
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
          return console.log('sucess', data);
        })
        .catch(err => console.log("hanlde errors better", err.message));
    } else {
      return console.log(billId + ' bill specifics already found');
    }
  });
}
