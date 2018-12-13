// Init AWS
var aws = require('aws-sdk');  
var ec2 = new aws.EC2();  
// OPTION - limit by region
// aws.config.region = 'eu-west-1';

// Variables for the script
// Changes below are not required but if you do change, then change to match
// delete and create lambda scripts.
const keyForEpochMakerinAMI = "DATETODEL-";
const keyForAMIsToDelete = "DeleteBackupsAutoOn"; 

// Epoch time from the AMI name is used to check if deletion is required.
// Epoch time is used as it passes AWS AMI naming allowed patterns
function checkIfAMIneedsDeleting(imageName){

    // Extract deletion date & time from image name
    var epochImageDeleteDate = parseInt(imageName.substr(imageName.indexOf(keyForEpochMakerinAMI) + keyForEpochMakerinAMI.length));
    
    // Changing slightly so delete and create can run on same cloudwatch event
    // 20 minutes = 20 * 60 seconds * 1000 milliseconds
    epochImageDeleteDate = epochImageDeleteDate - (20 * 60 * 1000);
    
    var timeNow = new Date().getTime(); 
    
    // check if epoch time for deletion has been reached
    if(epochImageDeleteDate > 0) {
    	if(epochImageDeleteDate > timeNow){
    		console.log("Not yet time to delete " + imageName);
    	}else {
    		console.log("Time to delete " + imageName);
            return true;
    	}
    }

    return false;
}

// Lambda handler
exports.handler = function(event, context) {  
ec2.describeImages({  
    Owners: [
        'self'
    ],
    Filters: [
    	{
	        Name: 'tag:' + keyForAMIsToDelete,
	        Values: [
	            'yes'
	        ]
	    },
	    /*
	    // OPTION - Add additional filters 
	    {
	        Name: 'tag:someOtherTagName',
	        Values: [
	            'someValue'
	        ]
	    }
    	*/
	]
}, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
    	var imagesToDelete = [];
    	
        for (var index in data.Images) {
            var imagename = data.Images[index].Name
            var imageid = data.Images[index].ImageId

            if (checkIfAMIneedsDeleting(imagename) === true) {
                imagesToDelete.push(data.Images[index]);
                var deregisterparams = {
                    ImageId: imageid
                };

                ec2.deregisterImage(deregisterparams, function(err, data01) {
                    if (err) console.log(err, err.stack); // an error occurred
                    else {
                        console.log("Image Deregistered");

                    }
                });
            }
        }
        setTimeout(function() {         
        	for (var imageIndex in imagesToDelete) {
                for (var j in imagesToDelete[imageIndex].BlockDeviceMappings) {                	
                	var blockDevice = imagesToDelete[imageIndex].BlockDeviceMappings[j];
                	if ('Ebs' in blockDevice) {
                        var snapparams = {
                            SnapshotId: blockDevice.Ebs.SnapshotId
                        };

                        ec2.deleteSnapshot(snapparams, function(err, data) {
                            if (err) console.log(err, err.stack); // an error occurred
                            else console.log("Snapshot Deleted"); // successful response
                        });
                    }
                }
            }
        }, 10000);
    }
});
}
