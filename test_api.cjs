const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('http://localhost:3000/api/v1/students', {
      params: {
        status: 'ACTIVE',
        enrollmentStatus: 'ENROLLED'
      }
    });
    console.log("Total students with ACTIVE and ENROLLED:", res.data.data ? res.data.data.length : res.data.length);
    
    // Also get all classrooms
    const classrooms = await axios.get('http://localhost:3000/api/v1/classrooms');
    console.log("Classrooms:", classrooms.data.data.map(c => c.name));
    
  } catch (err) {
    console.error(err.message);
  }
}
check();
