//Init AWS
var aws = require('aws-sdk');  
aws.config.region = 'eu-west-1'; //Change this to the region you like
var ec2 = new aws.EC2();  

//Variables for the script
//Changes below are not required but if you do change, then change to match delete and create lambda scripts.
const keyForEpochMakerinAMI = "DATETODEL-";
const keyForInstanceTagToBackup = "AutoDigiBackup"; 
const keyForInstanceTagDurationBackup = "AutoDigiBackupRetentionDays"; 
const keyForInstanceTagScheduledDays = "AutoDigiBackupSchedule"; //accepts day of week * / 0,1,2,3,4,5,6

//returns true or false based on tag value 
function checkIfBackupNeedsToRunToday(tagScheduleDays){
    tagScheduleDays = tagScheduleDays.trim(); //just removing accidental spaces by user.
        if(tagScheduleDays === "*"){
            return true; //all days so go ahead
        }

    var today=new Date();
    var dayOfWeek = today.getDay(); //this will be 0 for Sunday and upto 6 for Saturday.
    console.log("Should system process today? " + tagScheduleDays.includes(dayOfWeek));
    return tagScheduleDays.includes(dayOfWeek);
}

//Lambda handler
exports.handler = function(event, context) { 
    
    var instanceparams = {
        Filters: [{
            Name: 'tag:' + keyForInstanceTagToBackup,
            Values: [
                'yes'
            ]
        }]
    };
    
    ec2.describeInstances(instanceparams, function(err, data) {
        if (err) console.log(err, err.stack);
        else {
            for (var i in data.Reservations) {
                for (var j in data.Reservations[i].Instances) {
                    var instanceid = data.Reservations[i].Instances[j].InstanceId;
                    var name = "", backupRetentionDaysforAMI = -1, backupRunTodayCheck = "";
                    for (var k in data.Reservations[i].Instances[j].Tags) {
                        if (data.Reservations[i].Instances[j].Tags[k].Key == 'Name') {
                            name = data.Reservations[i].Instances[j].Tags[k].Value;
                        }
                        if(data.Reservations[i].Instances[j].Tags[k].Key == keyForInstanceTagDurationBackup){
                            backupRetentionDaysforAMI = parseInt(data.Reservations[i].Instances[j].Tags[k].Value);
                        }
                        if(data.Reservations[i].Instances[j].Tags[k].Key == keyForInstanceTagScheduledDays){
                            backupRunTodayCheck = data.Reservations[i].Instances[j].Tags[k].Value;
                        }                        
                    }
                    //cant find when to delete then dont proceed.
                    if((backupRetentionDaysforAMI < 1) || (checkIfBackupNeedsToRunToday(backupRunTodayCheck) === false)){
                        console.log("Skipping instance Name: " + name + " backupRetentionDaysforAMI: " + backupRetentionDaysforAMI + " backupRunTodayCheck: " + backupRunTodayCheck + " checkIfBackupNeedsToRunToday:" + checkIfBackupNeedsToRunToday(backupRunTodayCheck) + " (backupRetentionDaysforAMI > 0)" + (backupRetentionDaysforAMI > 0));
                    }else{
                        console.log("Processing instance Name: " + name + " backupRetentionDaysforAMI: " + backupRetentionDaysforAMI + " backupRunTodayCheck: " + backupRunTodayCheck + " checkIfBackupNeedsToRunToday:" + checkIfBackupNeedsToRunToday(backupRunTodayCheck) + " (backupRetentionDaysforAMI > 0)" + (backupRetentionDaysforAMI > 0));                        
                        var genDate = new Date();  
                        genDate.setDate(genDate.getDate() + backupRetentionDaysforAMI); //days that are required to be held
                        var imageparams = {
                            InstanceId: instanceid,
                            Name: name + "_" + keyForEpochMakerinAMI + genDate.getTime(),
                            // NoReboot: true
                        };
                        console.log(imageparams);
                        ec2.createImage(imageparams, function(err, data) {
                            if (err) console.log(err, err.stack);
                            else {
                                image = data.ImageId;
                                console.log(image);
                                var tagparams = {
                                    Resources: [image],
                                    Tags: [{
                                        Key: 'DeleteBackupsAutoOn',
                                        Value: 'yes'
                                    }]
                                };
                                ec2.createTags(tagparams, function(err, data) {
                                    if (err) console.log(err, err.stack);
                                    else console.log("Tags added to the created AMIs");
                                });
                            }
                        });
                    }
                }
            }
        }
    });
}