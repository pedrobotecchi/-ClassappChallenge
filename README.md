# Dev-Classapp Challenge
## Description
This program implements the ClassApp Challenge. The objective is to produce an specific form as "output.json" given an "input.csv" file and using NodeJs. 
## Implementation
The input file contains the following fields : 
    
    "fullname"
    "eid"
    "class"
    "class"
    "email" containing tags
    "phone" containing tags
    "Invisible"
    "see_all"

For reading the csv file, "fast-csv" was used.
The ideia was to organize the header in a way that tags could be easily inserted in the output format, to do this the header was separated and treated individually, after that the entries were verified and inserted accordingly


#### Some observation about the code
    -"eid" field works like an primary key, and two rows that have the same value must be converged into one.
    -There are two "class" fields that must be converged, and they can have their position changed over the input.file
    -Phones and Emails must be verified before inserting. phone verification was checked using google-libphonenumber (One thing that showed up and wasn't figured out was about te number (11) 98334228, it couldn't be validated using the library)
    -The google-libphonenumber although was recommended it wasn't used. Isntead libphonenumber-js was used. The fisrt one was not validating phones that had a (11) and started with 8 or 9. i.e. (11) 9******* or (11) 8*******. 
    
## Installation
Before running the code, run:

    npm install

Make sure that you have installed Iodash, fast-csv and libphonenumber-js before running the code. Maybe google-libphonenumber is necessary just to compile

Run:

    node ClassAppChallenge.js
