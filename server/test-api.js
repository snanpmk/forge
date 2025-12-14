const axios = require('axios');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5M2Q2ZjU5MTNlNDQyM2M0YmZkMmViZSIsImVtYWlsIjoicG1rc2luYW5AZ21haWwuY29tIiwiaWF0IjoxNzY1NzAxNjQwLCJleHAiOjE3NjU3ODgwNDB9.KpHg1zFoDL8pgElyWgUVoqp8GVRKep9TM2b5OolDU_k';
const API_URL = 'http://localhost:5000/api';

const run = async () => {
    try {
        console.log('1. Fetching current user...');
        const res1 = await axios.get(`${API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const currentCats = res1.data.finance_settings.categories.income;
        console.log('Current Income Categories:', currentCats);

        console.log('\n2. Adding "BackendTestCat"...');
        const newCats = [...currentCats, 'BackendTestCat'];
        
        const res2 = await axios.put(`${API_URL}/user/settings`, {
            finance_settings: {
                categories: {
                    income: newCats,
                    expense: res1.data.finance_settings.categories.expense
                }
            }
        }, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        console.log('Update Response:', res2.status);

        console.log('\n3. Verifying update...');
        const res3 = await axios.get(`${API_URL}/user`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const updatedCats = res3.data.finance_settings.categories.income;
        
        if (updatedCats.includes('BackendTestCat')) {
            console.log('SUCCESS: "BackendTestCat" found on server!');
        } else {
            console.error('FAILURE: Category not found.');
        }

    } catch (err) {
        console.error('Error:', err.response?.data || err.message);
    }
};

run();
