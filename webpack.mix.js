const mix = require('laravel-mix');

if (!mix.inProduction()) {
    mix
        // sets public path for manifest file
        .setPublicPath('dist/')

        // bundles js: (from, to)
        .js('example0/main.js', 'dist/example0.js')
        .sass('example1/index.scss', 'dist/example1.css')

} else {
    mix
        // sets public path for manifest file
        .setPublicPath('dist/')

        // bundles js: (from, to)
        .js('main.js', 'dist/')
}
