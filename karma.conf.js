module.exports = function(config){
  config.set({

    basePath : './',

    files : [
        'app/bower_components/angular/angular.js',
        'app/bower_components/angular-route/angular-route.js',
        'app/bower_components/angular-mocks/angular-mocks.js',
        'app/bower_components/ngstorage/ngStorage.js',
        'app/bower_components/angular-resource/angular-resource.js',
        'app/bower_components/ngInfiniteScroll/build/ng-infinite-scroll.js',
        'app/bower_components/ng-file-upload/ng-file-upload.js',
        'app/bower_components/angular-loading-bar/build/loading-bar.js',
        'app/bower_components/angular-animate/angular-animate.js',
        'app/scripts/app.js',
        'app/scripts/controllers/*.js',
        'app/scripts/services/*.js',
        'test/unit-tests/main_test.js'
    ],

    autoWatch : true,

    frameworks: ['jasmine'],

    browsers : ['Chrome'],

    plugins : [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine',
            'karma-junit-reporter'
            ],

    junitReporter : {
      outputFile: 'test_out/unit.xml',
      suite: 'unit'
    }

  });
};
