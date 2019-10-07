## Clone this repo
Make sure you have git installed on your machine.

Follow this link if you dont have git installed https://git-scm.com/downloads. 

Then open command prompt (or any other shell) and paste the below command.

```bash
git clone https://github.com/jagadeeshops/gmail-cleaner.git
```

If you have already cloned the code, Then go to the same directory and run `git pull`

Then move into the gmail-cleaner directory

`cd gmail-cleaner`

## Enable the Gmail Api(Required for the first time only) 

Complete the first step described in the [quickstart instructions](
https://developers.google.com/gmail/api/quickstart/nodejs) where you need to enable the gmail API for your account and then download the `credentials.json` file. 

Save that file in the same directory where you cloned the code.

This file has to be saved inside the gmail-cleaner direcotry.

> !!! IMPORTANT !!!
You should not share this contents of this credentials.json file with anyone. This will provide the programatic access to your gmail account with the token(from the next step).
This file is added in the gitignore of this project. So that you wont accidently share this file.
Same goes with the token.json file which will be generated when you run the code for the first time.


## Install nodejs 
Make sure you have the stable version of nodejs installed on your machine.

Follow this link if you dont have node installed https://nodejs.org/en/download/

Check the installation using this command `node --version`

## Install the dependencies
Execute the below command to install the dependencies

`npm install`

## Run

Run the cleaner using the below command

When you run the below command for the first time, It will print a url and ask you to open that url on the browser.
From the browser you will get a code. Copy and paste that code on the command prompt.
This is required for time only. It will cache that token for subsequent runs.

`npm start`
