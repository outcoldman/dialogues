

module.exports = function(grunt) {
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {      
      options: {
        node: true
      },
      all: [
        'Gruntfile.js', 
        'lib/**/*.js'
      ],
      tests: {
        // suppress chai asserts
        options: {
          expr: true
        },
        src: [ 'test/**/*.js' ]
      }
    },

    // Development
    watch: {
      dev: {
        files: ['lib/**/*.js', 'test/**/*.js'],
        tasks: ['jshint', 'mochaTest:test']
      }
    },

    // Tests
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/**/*.test.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['jshint','mochaTest:test']);
  grunt.registerTask('default', ['watch']);
};