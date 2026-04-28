const { api } = require('../authHelpers');
const Table = require('cli-table3');
const fs = require('fs');
const path = require('path');

function printProfilesTable(profiles) {
    if (!profiles || profiles.length === 0) {
        console.log("No profiles found.");
        return;
    }
    const table = new Table({
        head: ['ID', 'Name', 'Gender', 'Prob', 'Age', 'Grp', 'Country', 'Prob']
    });
    profiles.forEach(p => {
        table.push([
            p.id.substring(0,8) + '...',
            p.name,
            p.gender,
            p.gender_probability,
            p.age,
            p.age_group,
            p.country_id,
            p.country_probability
        ]);
    });
    console.log(table.toString());
}

async function handleRequest(requestPromise) {
    try {
        process.stdout.write("Loading...\r");
        const response = await requestPromise;
        process.stdout.write("          \r");
        return response.data;
    } catch (error) {
        process.stdout.write("          \r");
        if (error.response?.data?.message) {
            console.error(`Error: ${error.response.data.message}`);
        } else {
            console.error(`Error: ${error.message}`);
        }
        process.exit(1);
    }
}

async function list(options) {
    const params = new URLSearchParams();
    if (options.gender) params.append('gender', options.gender);
    if (options.country) params.append('country_id', options.country);
    if (options.ageGroup) params.append('age_group', options.ageGroup);
    if (options.minAge) params.append('min_age', options.minAge);
    if (options.maxAge) params.append('max_age', options.maxAge);
    if (options.sortBy) params.append('sort_by', options.sortBy);
    if (options.order) params.append('order', options.order);
    if (options.page) params.append('page', options.page);
    if (options.limit) params.append('limit', options.limit);

    const data = await handleRequest(api.get(`/api/profiles?${params.toString()}`));
    printProfilesTable(data.data);
    console.log(`Page ${data.page} of ${data.total_pages} (Total: ${data.total})`);
}

async function get(id) {
    const data = await handleRequest(api.get(`/api/profiles/${id}`));
    console.log(JSON.stringify(data.data, null, 2));
}

async function search(query) {
    const params = new URLSearchParams({ q: query });
    const data = await handleRequest(api.get(`/api/profiles/search?${params.toString()}`));
    printProfilesTable(data.data);
    console.log(`Found: ${data.total}`);
}

async function create(options) {
    const data = await handleRequest(api.post(`/api/profiles`, { name: options.name }));
    console.log("Profile created successfully!");
    console.log(JSON.stringify(data.data, null, 2));
}

async function exportProfiles(options) {
    const params = new URLSearchParams({ format: 'csv' });
    if (options.gender) params.append('gender', options.gender);
    if (options.country) params.append('country_id', options.country);
    if (options.ageGroup) params.append('age_group', options.ageGroup);
    if (options.minAge) params.append('min_age', options.minAge);
    if (options.maxAge) params.append('max_age', options.maxAge);

    try {
        process.stdout.write("Exporting...\r");
        const response = await api.get(`/api/profiles/export?${params.toString()}`, {
            responseType: 'arraybuffer'
        });
        const filename = `profiles_export_${Date.now()}.csv`;
        const filepath = path.join(process.cwd(), filename);
        fs.writeFileSync(filepath, response.data);
        process.stdout.write("            \r");
        console.log(`Exported successfully to ${filepath}`);
    } catch (error) {
        process.stdout.write("            \r");
        console.error("Export failed:", error.response ? "API Error" : error.message);
    }
}

module.exports = {
    list, get, search, create, exportProfiles
};
