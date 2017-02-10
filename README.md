# AWS AMI Automated Creation & Deletion System
A simple AWS lambda project to help automate creation and deletion of AMIs. The scripts are written in JavaScript and will run on the the serverless AWS Lambda platform.

## Motivation
Creating an AMI automatically snapshots all the associated EBS volumes for that instance. This makes instance recovery much more reliable and faster. A daily or weekly backup schedule is recommended for instances and to make sure you have a backup if ever needed. The system also removes the automatically created AMIs and any associated snapshots as per the settings.

## Setup / Installation of the Lambda script (one time setup)

1) Setting up the Lambda script by opening the Lambda console
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/lambda/1-lambda-select-blank.png)
2) Select "CloudWatch Events - Schedule" and click Next
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/lambda/2-select-cloudwatch-events-lambda.png)
3) Select a schedule you like to setup. Ideally the script has to run every day
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/lambda/3-setup-schedule.png)
4) Paste the script for createAMI.js
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/lambda/4-setup-script.png)
5) Create a new role and paste the roles/roles.json also increase timeout.
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/lambda/5-setup-role-next.png)
6) Save this and follow step above again now using deleteAMI.js.

## Setting the tags for EC2 instances (repeat for each instance) 

1) Login to your AWS console and open the EC2 section. Then select the instance
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/ec2/1-aws-ec2-console.png)
2) Select the add or edit tags as per settings
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/ec2/2-edit-tags.png)
3) Set the three tags with the following Keys & Value
    a) Key: AutoDigiBackup with Value: yes. This marks the instances that need to be backed up.
    b) Key: AutoDigiBackupRetentionDays with Value: from 1 to as many days as you want the backup to be stored.
    c) Key: AutoDigiBackupSchedule with Value: * (for every day) or a mix of number from 0 (Saturday), 1 (Monday) and all the way to 6 (Sunday). You can set value to say 012 which means run on Saturday, Monday and Tuesday. You can set just 6 to run only on Sunday.
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/ec2/3-a-5dayRetension-1234DaysRun.png)
Example below is set to create the AMI every day
![](https://dl.dropboxusercontent.com/u/1275078/screenshots/docs/screenshots/ec2/3-b-5dayRetention-Everyday.png)
Save the settings that are approriate for this instance and then save the tags. Please repeat steps 1-3 for all instances that you like to be included.