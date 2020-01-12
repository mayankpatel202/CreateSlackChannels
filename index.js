require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const _ = require('underscore');

const app = express();
app.use(bodyParser());

function formatEmail(emails) {
  
  let formattedEmail = {};
  let count = 0;
  for (let email of emails) {
    
    let emailNName = email.split("\t");
    let fEmail = emailNName[0].match(/^.*\@/)[0].slice(0, -1).toLowerCase();
    if (fEmail.length > 21) {
      fEmail = fEmail.slice(0, 21);
    }
    formattedEmail[fEmail] = [emailNName[1], fEmail];
    count++;
  }
  return formattedEmail;
}

function makeChannels(fromWorkspace, fromSheet) {
  let channelNames = [];
  let staff = {};
  for (let user of fromWorkspace)
    if (fromSheet.hasOwnProperty(user.name)) {
      let firstName = fromSheet[user.name][0].match(/\w+/)[0].toLowerCase();
      let lastName = fromSheet[user.name][0].match(/\s\w+-?\w+$/)
      
      if (lastName) {
        lastName = lastName[0].slice(1).toLowerCase()
      } else {
        lastName = "";
      }
      let chName;
      if (lastName === "") {
        chName = `chat_${firstName}`
      } else {
        chName = `chat_${firstName}_${lastName}`;
      }

      if (chName.length > 21) {
        lastName = lastName[0];
        chName = `chat_${firstName}_${lastName}`
      }
      channelNames.push({ channelName: chName, id: user.id });
    } 
    if (user.profile['display_name'] === 'staff_kathy') {
      staff['staff_kathy'] = user.id;
    } else if (user.profile['real_name'] === 'coach_mario') {
      staff['coach_mario'] = user.id;
    } else if (user.profile['display_name'] === 'staff_clarence') {
      staff['staff_clarence'] = user.id;
    } else if ( user.profile['display_name'] === 'coach heather') {
      staff['coach heather'] = user.id;
    } else if (user.profile['display_name'] === 'staff_bradley') {
      staff['coach_bradley'] = user.id;
    } else if (user.profile['display_name'] === 'staff_matthew') {
      staff['staff_matthew'] = user.id;
    } else if (user.profile['display_name'] === 'staff_vincent') {
      staff['staff_vincent'] = user.id;
    }

    

  }
  channelNames.push(staff);
  return channelNames;
}

async function inviteMembers(channel, members) {
  for (var member of members) {
    if (channel.group.name === member.channelName) {
      let ids = [];
      let memberId = member.id;
      let kathyId = members[members.length - 1]['staff_kathy'];
      let marioId = members[members.length - 1]['coach_mario'];
      let clarenceId = members[members.length - 1]['staff_clarence'];
      let bradleyId = members[members.length - 1]['coach_bradley'];
      let matthewId = members[members.length - 1]['staff_matthew'];
      let vincentId =  members[members.length - 1]['staff_vincent'];
      let heatherId =  members[members.length - 1]['coach heather'];
      ids.push(memberId, heatherId, bradleyId, marioId, kathyId, clarenceId, matthewId, vincentId);
      for (let id of ids) {
        let invited = await axios({
          url: 'https://slack.com/api/groups.invite',
          method: 'post',
          'Content-Type': 'application/json',
          data: { channel: channel.group.id, user: id },
          headers: {
            Authorization: `Bearer ${process.env.OAUTH_TOKEN}`
          }
        })
        .then((data) => {
          return data;
        })
        .catch((err) => console.log('ErrorInCreateChannels=====', err.Error));
      }

      return member.channelName;

    }
  }
}

async function createChannels(cnms) {
  for(nm of cnms) {
    if (nm.hasOwnProperty('channelName')) {
      let inviteData = await axios({
        url: 'https://slack.com/api/groups.create',
        method: 'post',
        'Content-Type': 'application/json',
        data: { name: nm.channelName },
        headers: {
          Authorization: `Bearer ${process.env.OAUTH_TOKEN}`
        }
      })
        .then((data) => {
          return data.data;
        })
        .catch((err) => console.log('ErrorInCreateChannels=====', err));

      let inviteDone = await inviteMembers(inviteData, cnms);  
    } else {
      console.log(" No channelName Property in line 132 in createChannels")
    }
  }  
}

app.post('/', (req, res) => {
  let channelMembers = formatEmail(req.body.text.split("\n"));
  axios({
    url: 'https://slack.com/api/users.list',
    method: 'get',
    headers: {
      Authorization: `Bearer ${process.env.OAUTH_TOKEN}`
    }
  })
  .then((response) => {
    return response.data.members
  })
  .then((users) => {
    return makeChannels(users, channelMembers);
  })
  .then((channelNames) => {
    createChannels(channelNames);
    console.log("DONE")
  })
  .catch((err) => console.log('Error=====', err));


  res.status(200);
  res.end();
})


app.listen('3000', () => {
  console.log("Listening on port 3000");
})