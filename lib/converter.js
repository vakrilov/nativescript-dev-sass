exports.convert = convert;

var fs = require('fs');
var path = require('path');
var sass = require('node-sass');
var glob = require('glob');

function convert(logger, projectDir, options) {
	return new Promise(function (resolve, reject) {
		options = options || {};
		
		var sassFilesPath = path.join(projectDir, 'app/**/*.scss');
    var sassImportPaths = [
      path.join(projectDir, 'app/'), 
      path.join(projectDir, 'node_modules/')
      ];
    //console.log("SASS Import Path", sassImportPaths);
    
		var sassFiles = glob.sync(sassFilesPath).filter(function(filePath){
			var path = filePath;
      var parts = path.split('/');
      var filename = parts[parts.length - 1];
			return path.indexOf("App_Resources") === -1 && filename.indexOf("_") !== 0;
		});
    
    if(sassFiles.length === 0){
      //No sass files in project; skip parsing
      resolve();
    } else {      
      var i = 0;
      var loopSassFilesAsync = function(sassFiles){
        parseSass(sassFiles[i], sassImportPaths, function(e){
          if(e !== undefined){
            //Error in the LESS parser; Reject promise
            reject(Error(sassFiles[i] + ' SASS CSS pre-processing failed. Error: ' + e));  
          }
          
          i++; //Increment loop counter
          
          if(i < sassFiles.length){
            loopSassFilesAsync(sassFiles);
          } else {
            //All files have been processed; Resolve promise
            resolve();
          }
        });
      }
      
      loopSassFilesAsync(sassFiles);
    }
	});
}

function parseSass(filePath, importPaths, callback){
  var sassFileContent = fs.readFileSync(filePath, { encoding: 'utf8'});
  var cssFilePath = filePath.replace('.scss', '.css');
  
  sass.render({
    data: sassFileContent,
    includePaths: importPaths,
    outFile: cssFilePath,
    outputStyle: 'compressed'
  }, function (e, output) {
    if(e) {
      //Callback with error
      callback(e);
    }      
    
    if(output === null){
      //No CSS content in converted scss file; No need to write file
      callback();
    } else {
      fs.writeFile(cssFilePath, output.css, 'utf8', function(){
        //File done writing
        callback();
      });  
    }                                                  
  });
}