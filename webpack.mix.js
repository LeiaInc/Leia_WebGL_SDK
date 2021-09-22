const mix = require('laravel-mix');
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');
// const CompressionPlugin = require('compression-webpack-plugin');
// require('laravel-mix-ejs');

if (!mix.inProduction()) {
    mix
        // sets public path for manifest file
        .setPublicPath('dist/')

        // bundles js: (from, to)
        .js('example0/main.js', 'dist/example0.js')
        .js('example1/main.js', 'dist/example1.js')
        .sass('example1/index.scss', 'dist/example1.css')

        // compiles sass and add css3 prefixes: (from, to)
        // .sass('src/styles/index.scss', 'dist/')

        // compiles ejs templates: (from, to, contents, options)
        // .ejs('src/views', 'dist', contents, { rmWhitespace: true, partials: 'src/views/partials' })

        // serves assets and sync with browser sync
        // .browserSync({ server: 'dist', proxy: null })
} else {
    mix
        // sets public path for manifest file
        .setPublicPath('dist/')

        // bundles js: (from, to)
        .js('main.js', 'dist/')

        // compiles sass and add css3 prefixes: (from, to)
        // .sass('src/styles/index.scss', 'dist/')

        // compiles ejs templates: (from, to, contents, options)
        // .ejs('src/views', 'dist', contents, { rmWhitespace: true, partials: 'src/views/partials' })

        // cleans dist directory and compresses assets
        // .webpackConfig({ plugins: [ new CleanWebpackPlugin(), new CompressionPlugin() ] })
}