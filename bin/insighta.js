#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { login, logout, whoami } = require('../commands/auth');
const profilesCmds = require('../commands/profiles');

program
    .name('insighta')
    .description('CLI tool for Insighta Labs+')
    .version('1.0.0');

// Auth Commands
program.command('login').description('Login using GitHub OAuth').action(login);
program.command('logout').description('Log out and clear credentials').action(logout);
program.command('whoami').description('Show current authenticated user').action(whoami);

// Profiles Commands
const profiles = program.command('profiles').description('Manage and query profiles');

profiles.command('list')
    .description('List and filter profiles')
    .option('--gender <value>', 'Filter by gender')
    .option('--country <value>', 'Filter by country ID')
    .option('--age-group <value>', 'Filter by age group')
    .option('--min-age <value>', 'Minimum age')
    .option('--max-age <value>', 'Maximum age')
    .option('--sort-by <value>', 'Sort field')
    .option('--order <value>', 'Sort order (asc/desc)')
    .option('--page <value>', 'Page number')
    .option('--limit <value>', 'Items per page')
    .action(profilesCmds.list);

profiles.command('get <id>')
    .description('Get a profile by ID')
    .action(profilesCmds.get);

profiles.command('search <query>')
    .description('Search profiles using natural language')
    .action(profilesCmds.search);

profiles.command('create')
    .description('Create a profile (Admins only)')
    .requiredOption('--name <value>', 'Name of the profile')
    .action(profilesCmds.create);

profiles.command('export')
    .description('Export profiles to CSV')
    .option('--format <value>', 'Export format (csv)', 'csv')
    .option('--gender <value>', '')
    .option('--country <value>', '')
    .option('--age-group <value>', '')
    .option('--min-age <value>', '')
    .option('--max-age <value>', '')
    .action(profilesCmds.exportProfiles);

program.parse(process.argv);
