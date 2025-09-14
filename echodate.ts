import * as fs from 'fs';
const dateString = new Date().toISOString();



fs.writeFileSync('static/version.txt', dateString);