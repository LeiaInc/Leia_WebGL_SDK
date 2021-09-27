const mix = require('laravel-mix');

mix
    // sets public path for manifest file
    .setPublicPath('dist/')

    // bundles js: (from, to)
    .js('main.js', 'dist/')
