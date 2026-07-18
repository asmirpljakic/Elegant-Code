const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'backend/.env' });

async function run() {
  const token = jwt.sign({ id: '6a5973ac4227002ccc724184' }, process.env.JWT_SECRET, { expiresIn: '1d' });
  
  const res = await fetch('http://localhost:5001/api/users?limit=1000', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  
  if (!res.ok) {
    console.error(data);
    process.exit(1);
  }
  
  console.log("Users count:", data.users?.length);
  console.log("Users:", data.users?.map(u => u.firstName));
  process.exit(0);
}
run();
