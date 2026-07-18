const fetch = require('node-fetch');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  try {
    // We will bypass login by generating a token directly for the Professor
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: '6a5973ac4227002ccc724184' }, process.env.JWT_SECRET, { expiresIn: '1d' });

    const response = await fetch('http://localhost:5001/api/users?limit=1000', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log("Total users fetched:", data.users?.length);
    if (data.users?.length > 0) {
      console.log("Roles found:", data.users.map(u => u.role));
      console.log("First names:", data.users.map(u => u.firstName));
    }
  } catch(e) {
    console.error(e);
  }
}
run();
