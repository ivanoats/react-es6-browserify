'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');

var livereload = require('gulp-livereload');
var connect = require('connect');
var serveStatic = require('serve-static');

var rename = require('gulp-rename');
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');


/** Config variables */
var serverPort = 8888;
var lrPort = 35731;


/** File paths */
var dist = 'dist';

var htmlFiles = 'app/**/*.html';
var htmlBuild = dist;

var jsxFiles = 'app/jsx/**/*.jsx';

var vendorFiles = [
    'bower_components/react/react-with-addons.js'
    ];
var vendorBuild = dist + '/vendor';
var requireFiles = './node_modules/react/react.js';


gulp.task('vendor', function () {
    return gulp.src(vendorFiles).
        pipe(gulp.dest(vendorBuild));
});


gulp.task('html', function () {
    return gulp.src(htmlFiles).
        pipe(gulp.dest(htmlBuild));
});


function compileScripts(watch) {
    gutil.log('Starting browserify');

    var entryFile = './app/jsx/app.jsx';

    var bundler;
    if (watch) {
        bundler = watchify(entryFile);
    } else {
        bundler = browserify(entryFile);
    }

    bundler.require(requireFiles);
    bundler.transform(babelify);

    var rebundle = function () {
        var stream = bundler.bundle({ debug: true});

        stream.on('error', function (err) { console.error(err) });
        stream = stream.pipe(source(entryFile));
        stream.pipe(rename('app.js'));

        stream.pipe(gulp.dest('dist/bundle'));
    };

    bundler.on('update', rebundle);
    return rebundle();
}


gulp.task('server', function (next) {
    var server = connect();
    server.use(serveStatic(dist)).listen(serverPort, next);
});


function initWatch(files, task) {
    if (typeof task === "string") {
        gulp.start(task);
        gulp.watch(files, [task]);
    } else {
        task.map(function (t) { gulp.start(t) });
        gulp.watch(files, task);
    }
}


/**
 * Run default task
 */
gulp.task('default', ['vendor', 'server'], function () {
    var lrServer = livereload(lrPort);
    var reloadPage = function (evt) {
        lrServer.changed(evt.path);
    };

    function initWatch(files, task) {
        gulp.start(task);
        gulp.watch(files, [task]);
    }

    compileScripts(true);
    initWatch(htmlFiles, 'html');

    gulp.watch([dist + '/**/*'], reloadPage);
});
